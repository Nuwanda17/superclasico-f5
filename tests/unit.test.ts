import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { DEMO_PLAYERS } from "../data/demoPlayers";
import { validatePlayerProfile, validateRating } from "../lib/playerValidation";
import { applyCommunityRatings, calculateOverall } from "../lib/ratings";
import { simulateMatch, validateLineups } from "../lib/simulationEngine";
import type { PlayerProfileInput, PlayerRatingSummary, RatingInput } from "../types/social";

const validProfile: PlayerProfileInput = { name: "Ricardo", number: 10, team: "cerro", preferredPosition: "MID" };
const validRating: RatingInput = { technique: 7, finishing: 7, passing: 7, defense: 7, stamina: 7, goalkeeping: 3, magic: 8, grit: 8, hype: 10, chaos: 5, trait: "Motorcito" };

test("normaliza y valida nombres reales sin interpretar texto", () => {
  const accepted = ["A'", "Ña", "José", "⚽ Leo", "<b>Ricardo</b>", "<script>alert(1)</script>"];
  for (const name of accepted) assert.equal(validatePlayerProfile({ ...validProfile, name }).errors.length, 0, name);
  assert.equal(validatePlayerProfile({ ...validProfile, name: "  José  " }).value?.name, "José");
  for (const name of ["", " ", "A", "⚽", "x".repeat(31)]) assert.ok(validatePlayerProfile({ ...validProfile, name }).errors.length > 0, name);
  assert.equal(validatePlayerProfile({ ...validProfile, name: "x".repeat(30) }).errors.length, 0);
});

test("acepta solamente dorsales enteros entre 1 y 99", () => {
  for (const number of [1, 10, 99]) assert.equal(validatePlayerProfile({ ...validProfile, number }).errors.length, 0);
  for (const number of [-1, 0, 100, 2.5, Number.NaN]) assert.ok(validatePlayerProfile({ ...validProfile, number }).errors.length > 0);
  assert.equal(validatePlayerProfile({ ...validProfile, number: undefined }).errors.length, 0);
});

test("rechaza ratings fuera de 1–10", () => {
  assert.equal(validateRating(validRating).errors.length, 0);
  for (const value of [0, 11, 4.5, Number.NaN]) assert.ok(validateRating({ ...validRating, technique: value }).errors.length > 0);
});

test("OVR pondera fútbol, casi ignora humo y prioriza arco en arqueros", () => {
  const base = { ...validRating };
  const noHype = calculateOverall({ ...base, hype: 1 }, false);
  const allHype = calculateOverall({ ...base, hype: 10 }, false);
  assert.ok(Math.abs(allHype - noHype) <= 1);
  assert.ok(calculateOverall({ ...base, goalkeeping: 10 }, true) > calculateOverall({ ...base, goalkeeping: 1 }, true));
  assert.ok(calculateOverall({ ...base, technique: 10 }, false) > calculateOverall({ ...base, technique: 1 }, false));
  for (let value = 1; value <= 10; value += 1) {
    const scores = calculateOverall({ ...base, technique: value, finishing: value, passing: value, defense: value, stamina: value }, false);
    assert.ok(scores >= 40 && scores <= 99);
  }
});

test("ratings cerrados no cambian el motor; revelados sí", () => {
  const player = DEMO_PLAYERS[0];
  const summary: PlayerRatingSummary = { playerId: player.id, voteCount: 2, revealed: false, overall: null, topTrait: null, ...validRating };
  assert.equal(applyCommunityRatings(player, summary).attack, player.attack);
  const revealed = applyCommunityRatings(player, { ...summary, voteCount: 3, revealed: true, overall: 80 });
  assert.notEqual(revealed.attack, player.attack);
  assert.ok(revealed.ratingSummary?.revealed);
});

test("valida cinco titulares y exactamente un arquero", () => {
  assert.deepEqual(validateLineups(DEMO_PLAYERS), []);
  const four = DEMO_PLAYERS.map((player) => player.id === "cerro-juan" ? { ...player, starter: false } : player);
  assert.match(validateLineups(four).join(" "), /necesita 1 titular/i);
  const noGoalkeeper = DEMO_PLAYERS.map((player) => player.team === "cerro" ? { ...player, goalkeeper: false } : player);
  assert.match(validateLineups(noGoalkeeper).join(" "), /arquero/i);
  const six = DEMO_PLAYERS.map((player) => player.id === "cerro-miguel" ? { ...player, starter: true } : player);
  assert.match(validateLineups(six).join(" "), /más de 5/i);
  const twoGoalkeepers = DEMO_PLAYERS.map((player) => player.id === "cerro-jose" ? { ...player, goalkeeper: true } : player);
  assert.match(validateLineups(twoGoalkeepers).join(" "), /exactamente un arquero/i);
});

test("mil simulaciones conservan marcador, actores, orden y distribución razonable", () => {
  const ids = new Set(DEMO_PLAYERS.filter((player) => player.starter).map((player) => player.id));
  let extreme = 0;
  let totalGoals = 0;
  for (let seed = 1; seed <= 1000; seed += 1) {
    const result = simulateMatch({ players: DEMO_PLAYERS, formations: { cerro: "1-2-1", olimpia: "2-1-1" }, seed });
    assert.ok(Number.isFinite(result.cerroGoals) && Number.isFinite(result.olimpiaGoals));
    assert.ok(result.cerroGoals >= 0 && result.olimpiaGoals >= 0);
    assert.equal(result.events.filter((event) => event.type === "goal" || event.type === "golazo").length, result.cerroGoals + result.olimpiaGoals);
    assert.equal(result.playerStats.reduce((sum, stats) => sum + stats.goals, 0), result.cerroGoals + result.olimpiaGoals);
    assert.ok(result.events.every((event) => event.minute >= 1 && event.minute <= 40 && event.text && !event.text.includes("undefined")));
    assert.deepEqual(result.events.map((event) => event.minute), [...result.events].map((event) => event.minute).sort((a, b) => a - b));
    assert.ok(result.events.every((event) => !event.player || ids.has(event.player.id)));
    assert.ok(result.playerStats.every((stats) => ids.has(stats.playerId) && Number.isFinite(stats.rating)));
    assert.ok(!result.mvpPlayerId || ids.has(result.mvpPlayerId));
    if (Math.max(result.cerroGoals, result.olimpiaGoals) >= 8 && Math.abs(result.cerroGoals - result.olimpiaGoals) >= 6) extreme += 1;
    totalGoals += result.cerroGoals + result.olimpiaGoals;
  }
  assert.ok(extreme <= 10, `resultados extremos: ${extreme}/1000`);
  assert.ok(totalGoals / 1000 >= 1.2 && totalGoals / 1000 <= 7, `promedio de goles: ${totalGoals / 1000}`);
});

test("SQL protege votos, duplicados, resumen privado y límites de titulares", async () => {
  const sql = await readFile(new URL("../supabase/setup.sql", import.meta.url), "utf8");
  assert.match(sql, /unique \(voter_user_id, target_player_id\)/i);
  assert.match(sql, /voter_user_id <>/i);
  assert.match(sql, /new\.voter_user_id <> auth\.uid\(\)/i);
  assert.match(sql, /create policy "voters read own ratings"[\s\S]*voter_user_id = auth\.uid\(\)/i);
  assert.match(sql, /self_rating_not_allowed/i);
  assert.match(sql, /team_already_has_five_starters/i);
  assert.match(sql, /add table public\.player_rating_summaries/i);
  assert.doesNotMatch(sql, /add table public\.ratings/i);
});
