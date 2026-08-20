import type { Player, Team } from "./player";

export type FormationId = "1-2-1" | "2-1-1" | "1-1-2" | "2-2" | "all-up";

export type MatchEventType =
  | "shot"
  | "shotWide"
  | "save"
  | "goal"
  | "recovery"
  | "counter"
  | "post"
  | "card"
  | "error"
  | "injury"
  | "fatigue"
  | "substitution"
  | "skill"
  | "argument"
  | "golazo"
  | "blooper";

export interface MatchEvent {
  id: string;
  minute: number;
  type: MatchEventType;
  team: Exclude<Team, "undecided">;
  player?: Player;
  secondaryPlayer?: Player;
  text: string;
}

export interface PlayerMatchStats {
  playerId: string;
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  saves: number;
  tackles: number;
  errors: number;
  cards: number;
  skills: number;
  positiveActions: number;
  rating: number;
}

export interface TeamMatchStats {
  shots: number;
  shotsOnTarget: number;
  saves: number;
  tackles: number;
  errors: number;
  cards: number;
}

export interface MatchAward {
  key: "mvp" | "tronco" | "chaos" | "wall" | "lungs" | "magic" | "grit";
  title: string;
  emoji: string;
  playerId: string;
  reason: string;
}

export interface MatchResult {
  id: string;
  playedAt: string;
  seed: number;
  cerroGoals: number;
  olimpiaGoals: number;
  events: MatchEvent[];
  playerStats: PlayerMatchStats[];
  teamStats: { cerro: TeamMatchStats; olimpia: TeamMatchStats };
  possession: { cerro: number; olimpia: number };
  mvpPlayerId?: string;
  awards: MatchAward[];
}

export interface MatchConfig {
  date: string;
  time: string;
  place: string;
}

export interface Prediction {
  id: string;
  predictor: string;
  cerroGoals: number;
  olimpiaGoals: number;
  mvpPlayerId?: string;
}

export interface RealResult {
  cerroGoals: number;
  olimpiaGoals: number;
}
