"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormationId, MatchResult } from "../types/match";
import type { Player } from "../types/player";
import type { PlayerProfileInput, PlayerRatingSummary, RatingInput, RatingRecord, RoomData, RoomStatus } from "../types/social";
import { createDemoRoomData, DEMO_USER_ID } from "../data/demoRoom";
import { calculateOverall, applyCommunityRatings } from "../lib/ratings";
import { createClient, isSupabaseConfigured } from "../lib/supabase/client";
import { createPlayer, deletePlayer, ensureAnonymousUser, friendlyDataError, loadRoom, saveMatchResult, setFormation, setGoalkeeper, setStarter, subscribeRoom, updatePlayer, upsertRating } from "../lib/socialRepository";

export interface MatchRoomController {
  status: RoomStatus;
  data: RoomData | null;
  userId: string | null;
  error: string | null;
  pendingKey: string | null;
  realtimeStatus: "connecting" | "connected" | "error";
  isDemo: boolean;
  retry: () => void;
  createMyPlayer: (input: PlayerProfileInput) => Promise<boolean>;
  updateMyPlayer: (playerId: string, input: PlayerProfileInput) => Promise<boolean>;
  removeMyPlayer: (playerId: string) => Promise<boolean>;
  ratePlayer: (playerId: string, input: RatingInput) => Promise<boolean>;
  toggleStarter: (player: Player) => Promise<boolean>;
  chooseGoalkeeper: (player: Player) => Promise<boolean>;
  changeFormation: (team: "cerro" | "olimpia", formation: FormationId) => Promise<boolean>;
  publishResult: (result: MatchResult) => Promise<boolean>;
}

export function useMatchRoom(slug: string, demoRequested = false): MatchRoomController {
  const isDemo = demoRequested && process.env.NODE_ENV === "development";
  const configured = isSupabaseConfigured();
  const [status, setStatus] = useState<RoomStatus>(isDemo ? "ready" : "loading");
  const [data, setData] = useState<RoomData | null>(() => isDemo ? createDemoRoomData() : null);
  const [userId, setUserId] = useState<string | null>(isDemo ? DEMO_USER_ID : null);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "connected" | "error">(isDemo ? "connected" : "connecting");
  const [retryCount, setRetryCount] = useState(0);
  const refreshTimer = useRef<number | null>(null);
  const mutationInFlight = useRef(false);

  const refresh = useCallback(async (silent = false) => {
    if (isDemo || !configured || !userId) return;
    if (!silent) setStatus("loading");
    try {
      const room = await loadRoom(createClient(), slug, userId);
      setData(room); setError(null); setStatus("ready");
    } catch (caught) {
      setError(friendlyDataError(caught)); setStatus(navigator.onLine ? "error" : "offline");
    }
  }, [configured, isDemo, slug, userId]);

  useEffect(() => {
    if (isDemo) {
      const timer = window.setTimeout(() => { setData(createDemoRoomData()); setUserId(DEMO_USER_ID); setError(null); setStatus("ready"); }, 0);
      return () => window.clearTimeout(timer);
    }
    if (!configured) {
      const timer = window.setTimeout(() => { setStatus("unconfigured"); setError("Falta conectar Supabase para compartir la previa entre teléfonos."); }, 0);
      return () => window.clearTimeout(timer);
    }
    let cancelled = false;
    const initialize = async () => {
      setStatus("loading");
      try {
        const id = await ensureAnonymousUser(createClient());
        if (cancelled) return;
        setUserId(id);
        const room = await loadRoom(createClient(), slug, id);
        if (cancelled) return;
        setData(room); setError(null); setStatus("ready");
      } catch (caught) {
        if (cancelled) return;
        setError(friendlyDataError(caught)); setStatus(navigator.onLine ? "error" : "offline");
      }
    };
    void initialize();
    return () => { cancelled = true; };
  }, [configured, isDemo, retryCount, slug]);

  useEffect(() => {
    if (isDemo || !configured || !userId || !data?.match.id) return;
    const cleanup = subscribeRoom(createClient(), data.match.id, () => {
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
      refreshTimer.current = window.setTimeout(() => void refresh(true), 180);
    }, setRealtimeStatus);
    return () => {
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
      cleanup();
    };
  }, [configured, data?.match.id, isDemo, refresh, userId]);

  useEffect(() => {
    const offline = () => setStatus("offline");
    const online = () => { setRetryCount((count) => count + 1); };
    window.addEventListener("offline", offline); window.addEventListener("online", online);
    return () => { window.removeEventListener("offline", offline); window.removeEventListener("online", online); };
  }, []);

  const run = useCallback(async (key: string, remoteAction: () => Promise<void>, demoAction?: () => void): Promise<boolean> => {
    if (mutationInFlight.current) return false;
    mutationInFlight.current = true;
    setPendingKey(key); setError(null);
    try {
      if (isDemo) demoAction?.(); else { await remoteAction(); await refresh(true); }
      return true;
    } catch (caught) {
      setError(friendlyDataError(caught));
      return false;
    } finally { mutationInFlight.current = false; setPendingKey(null); }
  }, [isDemo, refresh]);

  const controller = useMemo<MatchRoomController>(() => ({
    status, data, userId, error, pendingKey, realtimeStatus, isDemo,
    retry: () => setRetryCount((count) => count + 1),
    createMyPlayer: async (input) => data && userId ? run("player-save", () => createPlayer(createClient(), data.match.id, userId, input), () => setData((current) => current ? { ...current, players: [...current.players, { id: `demo-${Date.now()}`, matchId: current.match.id, ownerUserId: userId, ...input, attack: 3, defense: 3, stamina: 3, finishing: 3, passing: 3, goalkeeping: 3, magic: 3, grit: 3, hype: 3, chaos: 3, starter: false, goalkeeper: false, traits: [] }] } : current)) : false,
    updateMyPlayer: async (playerId, input) => run("player-save", () => updatePlayer(createClient(), playerId, input), () => setData((current) => current ? { ...current, players: current.players.map((player) => player.id === playerId ? { ...player, ...input } : player) } : current)),
    removeMyPlayer: async (playerId) => run("player-delete", () => deletePlayer(createClient(), playerId), () => setData((current) => current ? { ...current, players: current.players.filter((player) => player.id !== playerId) } : current)),
    ratePlayer: async (playerId, input) => {
      if (!data || !userId) return false;
      if (data.players.find((player) => player.id === playerId)?.ownerUserId === userId) {
        setError("😂 No vale votarte a vos mismo.");
        return false;
      }
      return run(`rating-${playerId}`, () => upsertRating(createClient(), data.match.id, userId, playerId, input), () => setData((current) => {
      if (!current) return current;
      const previous = current.myRatings[playerId];
      const record: RatingRecord = { id: previous?.id ?? `demo-rating-${Date.now()}`, targetPlayerId: playerId, ...input };
      const players = current.players.map((player) => {
        if (player.id !== playerId) return player;
        const voteCount = previous ? (player.ratingSummary?.voteCount ?? 0) : Math.min(3, (player.ratingSummary?.voteCount ?? 0) + 1);
        const summary: PlayerRatingSummary = { ...input, playerId, voteCount, revealed: voteCount >= 3, overall: null, topTrait: input.trait ?? null };
        summary.overall = summary.revealed ? calculateOverall(summary, player.goalkeeper) : null;
        return applyCommunityRatings(player, summary);
      });
      return { ...current, players, myRatings: { ...current.myRatings, [playerId]: record } };
      }));
    },
    toggleStarter: async (player) => run(`starter-${player.id}`, () => setStarter(createClient(), player.id, !player.starter), () => setData((current) => current ? { ...current, players: current.players.map((item) => item.id === player.id ? { ...item, starter: !item.starter, goalkeeper: item.starter ? false : item.goalkeeper } : item) } : current)),
    chooseGoalkeeper: async (player) => run(`goalkeeper-${player.id}`, () => setGoalkeeper(createClient(), player.id), () => setData((current) => current ? { ...current, players: current.players.map((item) => item.team === player.team ? { ...item, goalkeeper: item.id === player.id } : item) } : current)),
    changeFormation: async (team, formation) => data && userId ? run(`formation-${team}`, () => setFormation(createClient(), data.match.id, userId, team, formation), () => setData((current) => current ? { ...current, formations: { ...current.formations, [team]: formation } } : current)) : false,
    publishResult: async (result) => data && userId ? run("simulation", () => saveMatchResult(createClient(), data.match.id, userId, result), () => setData((current) => current ? { ...current, latestResult: { id: `demo-result-${Date.now()}`, matchId: current.match.id, createdBy: userId, createdAt: new Date().toISOString(), result } } : current)) : false,
  }), [data, error, isDemo, pendingKey, realtimeStatus, run, status, userId]);
  return controller;
}
