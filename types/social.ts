import type { MatchResult, FormationId } from "./match";
import type { Player, Position, Team } from "./player";

export const COMMUNITY_TRAITS = [
  "Francotirador",
  "Patrón de la defensa",
  "Motorcito",
  "Fantasista",
  "Tractor",
  "Impredecible",
  "Director técnico sin título",
  "Desaparece en las difíciles",
  "Juega como si fuera una final",
  "Siempre tiene algo",
  "Patea aunque no corresponda",
  "No larga una",
  "Ordena más de lo que juega",
] as const;

export type CommunityTrait = (typeof COMMUNITY_TRAITS)[number];

export interface RatingValues {
  technique: number;
  finishing: number;
  passing: number;
  defense: number;
  stamina: number;
  goalkeeping: number;
  magic: number;
  grit: number;
  hype: number;
  chaos: number;
}

export interface RatingInput extends RatingValues {
  trait?: CommunityTrait | null;
}

export interface RatingRecord extends RatingInput {
  id: string;
  targetPlayerId: string;
}

export interface PlayerRatingSummary extends RatingValues {
  playerId: string;
  voteCount: number;
  revealed: boolean;
  overall: number | null;
  topTrait: CommunityTrait | null;
}

export interface MatchRoom {
  id: string;
  slug: string;
  title: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string | null;
  venue: string | null;
  createdAt: string;
}

export interface TeamSetup {
  id: string;
  matchId: string;
  team: Exclude<Team, "undecided">;
  formation: FormationId;
}

export interface SharedMatchResult {
  id: string;
  matchId: string;
  createdBy: string;
  createdAt: string;
  result: MatchResult;
}

export interface RoomData {
  match: MatchRoom;
  players: Player[];
  formations: { cerro: FormationId; olimpia: FormationId };
  latestResult: SharedMatchResult | null;
  myRatings: Record<string, RatingRecord>;
}

export interface PlayerProfileInput {
  name: string;
  number?: number;
  team: Team;
  preferredPosition: Position;
}

export type RoomStatus = "loading" | "ready" | "error" | "offline" | "unconfigured";
