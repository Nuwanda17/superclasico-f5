import type { Player } from "../types/player";
import type { PlayerRatingSummary, RatingValues } from "../types/social";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/**
 * El OVR prioriza capacidad futbolística y normaliza 1–10 a 40–99.
 * Campo: técnica 25%, definición 22%, pase 20%, defensa 18%, resistencia 15%.
 * Arquero: arco 55%, técnica 12%, defensa 12%, pase/resistencia 8% y huevo 5%.
 * Magia y huevo ajustan levemente; caos resta un poco y humo casi no influye.
 */
export function calculateOverall(values: RatingValues, goalkeeper: boolean): number {
  const footballScore = goalkeeper
    ? values.goalkeeping * 0.55 + values.technique * 0.12 + values.defense * 0.12 + values.passing * 0.08 + values.stamina * 0.08 + values.grit * 0.05
    : values.technique * 0.25 + values.finishing * 0.22 + values.passing * 0.20 + values.defense * 0.18 + values.stamina * 0.15;
  const personalityModifier = (values.magic - 5.5) * 0.06 + (values.grit - 5.5) * 0.05 - (values.chaos - 5.5) * 0.025 + (values.hype - 5.5) * 0.008;
  const normalized = 40 + ((clamp(footballScore + personalityModifier, 1, 10) - 1) / 9) * 59;
  return Math.round(clamp(normalized, 40, 99));
}

const toFive = (value: number) => Number((1 + ((clamp(value, 1, 10) - 1) / 9) * 4).toFixed(2));

export function applyCommunityRatings(player: Player, summary?: PlayerRatingSummary): Player {
  if (!summary || !summary.revealed) return { ...player, ratingSummary: summary };
  return {
    ...player,
    attack: toFive(summary.technique * 0.45 + summary.finishing * 0.55),
    defense: toFive(summary.defense),
    stamina: toFive(summary.stamina),
    finishing: toFive(summary.finishing),
    passing: toFive(summary.passing),
    goalkeeping: toFive(summary.goalkeeping),
    magic: toFive(summary.magic),
    grit: toFive(summary.grit),
    hype: toFive(summary.hype),
    chaos: toFive(summary.chaos),
    ratingSummary: summary,
  };
}

export function emptySummary(playerId: string, voteCount = 0): PlayerRatingSummary {
  return { playerId, voteCount, revealed: false, overall: null, topTrait: null, technique: 0, finishing: 0, passing: 0, defense: 0, stamina: 0, goalkeeping: 0, magic: 0, grit: 0, hype: 0, chaos: 0 };
}
