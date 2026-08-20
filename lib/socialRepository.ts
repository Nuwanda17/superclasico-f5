import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { calculateOverall, emptySummary, applyCommunityRatings } from "./ratings";
import type { MatchResult, FormationId } from "../types/match";
import type { Player, Position, Team } from "../types/player";
import type { MatchRoom, PlayerProfileInput, PlayerRatingSummary, RatingInput, RatingRecord, RoomData, SharedMatchResult, TeamSetup } from "../types/social";

const REQUEST_TIMEOUT_MS = 12_000;

interface MatchRow { id: string; slug: string; title: string; home_team: string; away_team: string; match_date: string | null; venue: string | null; created_at: string }
interface PlayerRow { id: string; match_id: string; owner_user_id: string | null; name: string; team: Team; preferred_position: Position; number: number | null; starter: boolean; goalkeeper: boolean }
interface SummaryRow { target_player_id: string; match_id: string; vote_count: number; technique: number | string | null; finishing: number | string | null; passing: number | string | null; defense: number | string | null; stamina: number | string | null; goalkeeping: number | string | null; magic: number | string | null; grit: number | string | null; hype: number | string | null; chaos: number | string | null; top_trait: PlayerRatingSummary["topTrait"] }
interface SetupRow { id: string; match_id: string; team: "cerro" | "olimpia"; formation: FormationId }
interface RatingRow extends Omit<RatingRecord, "targetPlayerId"> { target_player_id: string }
interface ResultRow { id: string; match_id: string; created_by: string; created_at: string; result: MatchResult }

function timeout<T>(promise: PromiseLike<T>, ms = REQUEST_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error("REQUEST_TIMEOUT")), ms)),
  ]);
}

function assertResponse<T extends { error: { message: string; code?: string } | null }>(response: T): T {
  if (response.error) throw new Error(`${response.error.code ?? "SUPABASE_ERROR"}:${response.error.message}`);
  return response;
}

export function friendlyDataError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("SUPABASE_NOT_CONFIGURED")) return "Falta conectar la base compartida de Supabase.";
  if (message.includes("REQUEST_TIMEOUT")) return "La cancha está tardando demasiado en responder. Probá de nuevo.";
  if (message.includes("ANONYMOUS_USER_NOT_CREATED") || message.includes("Invalid Refresh Token") || message.includes("JWT")) return "Tu sesión venció. Recargá la página para volver a entrar a la previa.";
  if (message.includes("PGRST116")) return "No encontramos este partido. Revisá que el link esté completo.";
  if (message.includes("self_rating_not_allowed")) return "😂 No vale votarte a vos mismo.";
  if (message.includes("team_already_has_five_starters")) return "Ese equipo ya tiene cinco titulares.";
  if (message.includes("starter_requires_team")) return "Primero asigná el jugador a Cerro u Olimpia.";
  if (message.includes("goalkeeper_must_be_starter")) return "Primero poné al arquero entre los titulares.";
  if (message.includes("players_one_profile_per_user_match")) return "Ya tenés un jugador anotado en este partido.";
  if (message.includes("Failed to fetch") || message.includes("NetworkError")) return "No pudimos conectar con la previa. Revisá tu conexión.";
  return "La jugada no salió. Probá nuevamente en unos segundos.";
}

export async function ensureAnonymousUser(supabase: SupabaseClient): Promise<string> {
  const sessionResponse = assertResponse(await timeout(supabase.auth.getSession()));
  if (sessionResponse.data.session?.user.id) return sessionResponse.data.session.user.id;
  const signInResponse = assertResponse(await timeout(supabase.auth.signInAnonymously()));
  const userId = signInResponse.data.user?.id;
  if (!userId) throw new Error("ANONYMOUS_USER_NOT_CREATED");
  return userId;
}

const toRoom = (row: MatchRow): MatchRoom => ({ id: row.id, slug: row.slug, title: row.title, homeTeam: row.home_team, awayTeam: row.away_team, matchDate: row.match_date, venue: row.venue, createdAt: row.created_at });

function toSummary(row: SummaryRow, player: Player): PlayerRatingSummary {
  const value = (input: SummaryRow[keyof SummaryRow]) => input === null ? 0 : Number(input);
  const revealed = row.vote_count >= 3;
  const summary: PlayerRatingSummary = {
    playerId: row.target_player_id,
    voteCount: row.vote_count,
    revealed,
    overall: null,
    topTrait: revealed ? row.top_trait : null,
    technique: value(row.technique), finishing: value(row.finishing), passing: value(row.passing), defense: value(row.defense), stamina: value(row.stamina),
    goalkeeping: value(row.goalkeeping), magic: value(row.magic), grit: value(row.grit), hype: value(row.hype), chaos: value(row.chaos),
  };
  summary.overall = revealed ? calculateOverall(summary, player.goalkeeper || player.preferredPosition === "GK") : null;
  return summary;
}

function toPlayer(row: PlayerRow): Player {
  return {
    id: row.id, matchId: row.match_id, ownerUserId: row.owner_user_id, name: row.name, number: row.number ?? undefined,
    team: row.team, preferredPosition: row.preferred_position,
    attack: 3, defense: 3, stamina: 3, finishing: 3, passing: 3, goalkeeping: 3, magic: 3, grit: 3, hype: 3, chaos: 3,
    starter: row.starter, goalkeeper: row.goalkeeper, traits: [],
  };
}

function toRating(row: RatingRow): RatingRecord {
  return { ...row, targetPlayerId: row.target_player_id };
}

export async function loadRoom(supabase: SupabaseClient, slug: string, userId: string): Promise<RoomData> {
  const matchResponse = assertResponse(await timeout(supabase.from("matches").select("*").eq("slug", slug).single()));
  const matchRow = matchResponse.data as unknown as MatchRow;
  const [playersResponse, summariesResponse, setupsResponse, resultResponse, myRatingsResponse] = await Promise.all([
    timeout(supabase.from("players").select("*").eq("match_id", matchRow.id).order("created_at")),
    timeout(supabase.from("player_rating_summaries").select("*").eq("match_id", matchRow.id)),
    timeout(supabase.from("team_setups").select("*").eq("match_id", matchRow.id)),
    timeout(supabase.from("match_results").select("*").eq("match_id", matchRow.id).order("created_at", { ascending: false }).limit(1).maybeSingle()),
    timeout(supabase.from("ratings").select("*").eq("match_id", matchRow.id).eq("voter_user_id", userId)),
  ]);
  assertResponse(playersResponse); assertResponse(summariesResponse); assertResponse(setupsResponse); assertResponse(resultResponse); assertResponse(myRatingsResponse);
  const basePlayers = ((playersResponse.data ?? []) as unknown as PlayerRow[]).map(toPlayer);
  const summaryRows = (summariesResponse.data ?? []) as unknown as SummaryRow[];
  const players = basePlayers.map((player) => {
    const row = summaryRows.find((summary) => summary.target_player_id === player.id);
    return applyCommunityRatings(player, row ? toSummary(row, player) : emptySummary(player.id));
  });
  const setups = (setupsResponse.data ?? []) as unknown as SetupRow[];
  const formations = {
    cerro: setups.find((setup) => setup.team === "cerro")?.formation ?? "1-2-1",
    olimpia: setups.find((setup) => setup.team === "olimpia")?.formation ?? "2-1-1",
  } satisfies { cerro: FormationId; olimpia: FormationId };
  const resultRow = resultResponse.data as unknown as ResultRow | null;
  const latestResult: SharedMatchResult | null = resultRow ? { id: resultRow.id, matchId: resultRow.match_id, createdBy: resultRow.created_by, createdAt: resultRow.created_at, result: resultRow.result } : null;
  const myRatings = Object.fromEntries(((myRatingsResponse.data ?? []) as unknown as RatingRow[]).map((row) => [row.target_player_id, toRating(row)]));
  return { match: toRoom(matchRow), players, formations, latestResult, myRatings };
}

export async function createPlayer(supabase: SupabaseClient, matchId: string, userId: string, input: PlayerProfileInput): Promise<void> {
  assertResponse(await timeout(supabase.from("players").insert({ match_id: matchId, owner_user_id: userId, name: input.name, team: input.team, preferred_position: input.preferredPosition, number: input.number ?? null, starter: false, goalkeeper: false })));
}

export async function updatePlayer(supabase: SupabaseClient, playerId: string, input: PlayerProfileInput): Promise<void> {
  assertResponse(await timeout(supabase.from("players").update({ name: input.name, team: input.team, preferred_position: input.preferredPosition, number: input.number ?? null }).eq("id", playerId)));
}

export async function deletePlayer(supabase: SupabaseClient, playerId: string): Promise<void> {
  assertResponse(await timeout(supabase.from("players").delete().eq("id", playerId)));
}

export async function upsertRating(supabase: SupabaseClient, matchId: string, userId: string, playerId: string, input: RatingInput): Promise<void> {
  assertResponse(await timeout(supabase.from("ratings").upsert({ match_id: matchId, voter_user_id: userId, target_player_id: playerId, ...input, trait: input.trait ?? null, updated_at: new Date().toISOString() }, { onConflict: "voter_user_id,target_player_id" })));
}

export async function setStarter(supabase: SupabaseClient, playerId: string, starter: boolean): Promise<void> {
  assertResponse(await timeout(supabase.rpc("set_player_starter", { p_player_id: playerId, p_starter: starter })));
}

export async function setGoalkeeper(supabase: SupabaseClient, playerId: string): Promise<void> {
  assertResponse(await timeout(supabase.rpc("set_match_goalkeeper", { p_player_id: playerId })));
}

export async function setFormation(supabase: SupabaseClient, matchId: string, userId: string, team: "cerro" | "olimpia", formation: FormationId): Promise<void> {
  assertResponse(await timeout(supabase.from("team_setups").upsert({ match_id: matchId, team, formation, updated_by: userId, updated_at: new Date().toISOString() }, { onConflict: "match_id,team" })));
}

export async function saveMatchResult(supabase: SupabaseClient, matchId: string, userId: string, result: MatchResult): Promise<void> {
  assertResponse(await timeout(supabase.from("match_results").insert({ match_id: matchId, created_by: userId, result })));
}

export function subscribeRoom(supabase: SupabaseClient, matchId: string, onChange: () => void, onStatus: (status: "connected" | "error") => void): () => void {
  let channel: RealtimeChannel | null = supabase.channel(`match-room-${matchId}`);
  (["players", "player_rating_summaries", "team_setups", "match_results"] as const).forEach((table) => {
    channel = channel!.on("postgres_changes", { event: "*", schema: "public", table }, onChange);
  });
  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") onStatus("connected");
    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") onStatus("error");
  });
  return () => { if (channel) void supabase.removeChannel(channel); channel = null; };
}

export type { TeamSetup };
