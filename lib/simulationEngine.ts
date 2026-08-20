import { commentaryLine } from "./commentary";
import type { FormationId, MatchAward, MatchEvent, MatchEventType, MatchResult, PlayerMatchStats, TeamMatchStats } from "../types/match";
import type { Player } from "../types/player";

type PlayingTeam = "cerro" | "olimpia";

interface SimulateInput {
  players: Player[];
  formations: Record<PlayingTeam, FormationId>;
  seed?: number;
}

const emptyTeamStats = (): TeamMatchStats => ({ shots: 0, shotsOnTarget: 0, saves: 0, tackles: 0, errors: 0, cards: 0 });

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const average = (players: Player[], field: keyof Pick<Player, "attack" | "defense" | "stamina" | "finishing" | "passing" | "goalkeeping" | "magic" | "grit" | "chaos">) =>
  players.reduce((sum, player) => sum + Number(player[field]), 0) / Math.max(players.length, 1);

const formationModifier: Record<FormationId, { attack: number; defense: number }> = {
  "1-2-1": { attack: 0.1, defense: 0.15 },
  "2-1-1": { attack: -0.05, defense: 0.35 },
  "1-1-2": { attack: 0.35, defense: -0.05 },
  "2-2": { attack: 0.2, defense: 0.1 },
  "all-up": { attack: 0.65, defense: -0.65 },
};

function weightedPlayer(players: Player[], random: () => number, fields: Array<keyof Player>): Player {
  const weights = players.map((player) => fields.reduce((sum, field) => sum + Number(player[field]), 0));
  const total = weights.reduce((sum, value) => sum + value, 0);
  let cursor = random() * total;
  for (let index = 0; index < players.length; index += 1) {
    cursor -= weights[index];
    if (cursor <= 0) return players[index];
  }
  return players[players.length - 1];
}

function getStats(stats: Map<string, PlayerMatchStats>, playerId: string): PlayerMatchStats {
  const value = stats.get(playerId);
  if (!value) throw new Error(`No stats available for ${playerId}`);
  return value;
}

function createAwards(players: Player[], playerStats: PlayerMatchStats[]): MatchAward[] {
  const by = (score: (stats: PlayerMatchStats, player: Player) => number, lowest = false) => {
    const sorted = [...playerStats].sort((a, b) => {
      const playerA = players.find((player) => player.id === a.playerId)!;
      const playerB = players.find((player) => player.id === b.playerId)!;
      const result = score(b, playerB) - score(a, playerA);
      return lowest ? -result : result;
    });
    return sorted[0].playerId;
  };
  return [
    { key: "mvp", title: "Figura del partido", emoji: "🏆", playerId: by((s) => s.rating), reason: "El que más hizo para parecer profesionales." },
    { key: "tronco", title: "Tronco del partido", emoji: "🪵", playerId: by((s) => s.rating, true), reason: "Una actuación para olvidar con urgencia." },
    { key: "chaos", title: "¿Para qué hiciste eso?", emoji: "🤡", playerId: by((s, p) => s.errors * 3 + p.chaos), reason: "Lideró el índice de decisiones inexplicables." },
    { key: "wall", title: "Muralla", emoji: "🧤", playerId: by((s, p) => s.saves * 4 + p.goalkeeping), reason: "Puso las manos, el cuerpo y lo que encontró." },
    { key: "lungs", title: "Pulmón", emoji: "🫁", playerId: by((s, p) => p.stamina * 2 + s.positiveActions), reason: "Todavía podía respirar al minuto cuarenta." },
    { key: "magic", title: "Magia", emoji: "🎩", playerId: by((s, p) => s.skills * 4 + p.magic), reason: "Dejó la jugada que merecía repetición." },
    { key: "grit", title: "Huevo", emoji: "🔥", playerId: by((s, p) => s.tackles * 3 + p.grit), reason: "Metió como si hubiera una copa en juego." },
  ];
}

export function validateLineups(players: Player[]): string[] {
  const errors: string[] = [];
  (["cerro", "olimpia"] as PlayingTeam[]).forEach((team) => {
    const label = team === "cerro" ? "Cerro" : "Olimpia";
    const starters = players.filter((player) => player.team === team && player.starter);
    if (starters.length < 5) errors.push(`${label} todavía necesita ${5 - starters.length} titular${5 - starters.length === 1 ? "" : "es"} para poder jugar.`);
    if (starters.length > 5) errors.push(`${label} tiene más de 5 titulares.`);
    if (starters.filter((player) => player.goalkeeper).length !== 1) errors.push(`${label} necesita seleccionar exactamente un arquero.`);
  });
  return errors;
}

export function simulateMatch({ players, formations, seed = Math.floor(Date.now() % 2147483647) }: SimulateInput): MatchResult {
  const lineupErrors = validateLineups(players);
  if (lineupErrors.length) throw new Error(lineupErrors.join(" "));
  const random = seededRandom(seed);
  const squads: Record<PlayingTeam, Player[]> = {
    cerro: players.filter((player) => player.team === "cerro" && player.starter),
    olimpia: players.filter((player) => player.team === "olimpia" && player.starter),
  };
  const stats = new Map<string, PlayerMatchStats>();
  [...squads.cerro, ...squads.olimpia].forEach((player) => stats.set(player.id, {
    playerId: player.id, goals: 0, assists: 0, shots: 0, shotsOnTarget: 0, saves: 0, tackles: 0, errors: 0, cards: 0, skills: 0, positiveActions: 0, rating: 6,
  }));
  const teamStats = { cerro: emptyTeamStats(), olimpia: emptyTeamStats() };
  const goals = { cerro: 0, olimpia: 0 };
  const events: MatchEvent[] = [];
  let eventIndex = 0;

  const addEvent = (minute: number, type: MatchEventType, team: PlayingTeam, text: string, player?: Player, secondaryPlayer?: Player) => {
    events.push({ id: `${seed}-${eventIndex++}`, minute, type, team, text, player, secondaryPlayer });
  };

  for (let minute = 1; minute <= 40; minute += 1) {
    const fatigueMoment = minute > 25;
    if (random() > 0.43 + (minute === 20 || minute === 40 ? 0.2 : 0)) continue;

    const cerroAttack = average(squads.cerro, "attack") + average(squads.cerro, "passing") * 0.65 + average(squads.cerro, "magic") * 0.35 + formationModifier[formations.cerro].attack;
    const olimpiaAttack = average(squads.olimpia, "attack") + average(squads.olimpia, "passing") * 0.65 + average(squads.olimpia, "magic") * 0.35 + formationModifier[formations.olimpia].attack;
    const cerroDefense = average(squads.cerro, "defense") + average(squads.cerro, "grit") * 0.35 + formationModifier[formations.cerro].defense;
    const olimpiaDefense = average(squads.olimpia, "defense") + average(squads.olimpia, "grit") * 0.35 + formationModifier[formations.olimpia].defense;
    const cerroChance = Math.max(1, cerroAttack - olimpiaDefense * 0.45 + random() * 2);
    const olimpiaChance = Math.max(1, olimpiaAttack - cerroDefense * 0.45 + random() * 2);
    const team: PlayingTeam = random() < cerroChance / (cerroChance + olimpiaChance) ? "cerro" : "olimpia";
    const opponent: PlayingTeam = team === "cerro" ? "olimpia" : "cerro";
    const teamLabel = team === "cerro" ? "CERRO" : "OLIMPIA";
    const opponentLabel = opponent === "cerro" ? "Cerro" : "Olimpia";
    const actor = weightedPlayer(squads[team].filter((p) => !p.goalkeeper), random, ["attack", "magic", "finishing"]);
    const actorStats = getStats(stats, actor.id);
    const chaosChance = actor.chaos * 0.025;
    const roll = random();

    if (fatigueMoment && actor.stamina <= 2 && roll < 0.13) {
      addEvent(minute, "fatigue", team, commentaryLine("fatigue", random, { jugador: actor.name }), actor);
      continue;
    }
    if (roll < 0.10 + chaosChance) {
      actorStats.errors += 1; teamStats[team].errors += 1; actorStats.rating -= 0.35;
      addEvent(minute, actor.chaos >= 4 && random() < 0.35 ? "blooper" : "error", team, commentaryLine(actor.chaos >= 4 ? "blooper" : "error", random, { jugador: actor.name }), actor);
      continue;
    }
    if (roll < 0.18) {
      const defender = weightedPlayer(squads[team], random, ["defense", "grit"]);
      const defenderStats = getStats(stats, defender.id);
      defenderStats.tackles += 1; defenderStats.positiveActions += 1; defenderStats.rating += 0.15; teamStats[team].tackles += 1;
      addEvent(minute, "recovery", team, commentaryLine("recovery", random, { jugador: defender.name }), defender);
      continue;
    }
    if (roll < 0.24) {
      actorStats.skills += 1; actorStats.positiveActions += 1; actorStats.rating += 0.18;
      addEvent(minute, "skill", team, commentaryLine("skill", random, { jugador: actor.name }), actor);
      continue;
    }
    if (roll < 0.28) {
      actorStats.cards += 1; teamStats[team].cards += 1; actorStats.rating -= 0.2;
      addEvent(minute, "card", team, commentaryLine("card", random, { jugador: actor.name }), actor);
      continue;
    }
    if (roll < 0.32) {
      addEvent(minute, "argument", team, commentaryLine("argument", random, { jugador: actor.name }), actor);
      continue;
    }

    actorStats.shots += 1; teamStats[team].shots += 1;
    const staminaPenalty = fatigueMoment ? Math.max(0, 3 - actor.stamina) * 0.35 : 0;
    const onTargetScore = actor.finishing * 0.48 + actor.attack * 0.22 + actor.magic * 0.12 - staminaPenalty + random() * 2.5;
    if (onTargetScore < 3.2) {
      addEvent(minute, "shotWide", team, commentaryLine("shot", random, { jugador: actor.name }), actor);
      continue;
    }
    actorStats.shotsOnTarget += 1; teamStats[team].shotsOnTarget += 1;
    if (random() < 0.10) {
      addEvent(minute, "post", team, commentaryLine("post", random, { jugador: actor.name, rival: opponentLabel }), actor);
      continue;
    }
    const goalkeeper = squads[opponent].find((player) => player.goalkeeper)!;
    const goalkeeperStats = getStats(stats, goalkeeper.id);
    const goalScore = actor.finishing * 0.52 + actor.magic * 0.15 + random() * 3.3 - goalkeeper.goalkeeping * 0.47 - (fatigueMoment ? staminaPenalty : 0);
    const lateGrit = minute >= 34 ? actor.grit * 0.09 : 0;
    if (goalScore + lateGrit > 1.8) {
      const assisterCandidates = squads[team].filter((player) => player.id !== actor.id && !player.goalkeeper);
      const assister = random() < 0.72 ? weightedPlayer(assisterCandidates, random, ["passing", "magic"]) : undefined;
      goals[team] += 1; actorStats.goals += 1; actorStats.positiveActions += 2; actorStats.rating += 1.1;
      if (assister) { const assistStats = getStats(stats, assister.id); assistStats.assists += 1; assistStats.positiveActions += 1; assistStats.rating += 0.55; }
      const isGolazo = actor.magic >= 4 && random() < 0.25;
      addEvent(minute, isGolazo ? "golazo" : "goal", team, commentaryLine("goal", random, { jugador: actor.name, equipo: teamLabel }), actor, assister);
    } else {
      goalkeeperStats.saves += 1; goalkeeperStats.positiveActions += 1; goalkeeperStats.rating += 0.28; teamStats[opponent].saves += 1;
      addEvent(minute, "save", team, commentaryLine("save", random, { arquero: goalkeeper.name }), actor, goalkeeper);
    }
  }

  const allStats = Array.from(stats.values()).map((value) => ({ ...value, rating: Math.max(3.5, Math.min(10, Number(value.rating.toFixed(1)))) }));
  const awards = createAwards([...squads.cerro, ...squads.olimpia], allStats);
  const mvpPlayerId = awards.find((award) => award.key === "mvp")?.playerId;
  const creationCerro = average(squads.cerro, "passing") + average(squads.cerro, "magic") * 0.5;
  const creationOlimpia = average(squads.olimpia, "passing") + average(squads.olimpia, "magic") * 0.5;
  const cerroPossession = Math.round(45 + ((creationCerro - creationOlimpia) / 8) * 10 + random() * 8);
  const possessionCerro = Math.max(38, Math.min(62, cerroPossession));
  return {
    id: `match-${seed}`,
    playedAt: new Date().toISOString(),
    seed,
    cerroGoals: goals.cerro,
    olimpiaGoals: goals.olimpia,
    events: events.sort((a, b) => a.minute - b.minute),
    playerStats: allStats,
    teamStats,
    possession: { cerro: possessionCerro, olimpia: 100 - possessionCerro },
    mvpPlayerId,
    awards,
  };
}
