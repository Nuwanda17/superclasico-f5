export type Team = "cerro" | "olimpia" | "undecided";

export type Position = "GK" | "DEF" | "MID" | "FWD" | "ALL";

export type PlayerTrait =
  | "shootsFromDistance"
  | "highPress"
  | "clutch"
  | "errorProne"
  | "dribbler"
  | "goalkeeperSweeper";

export interface Player {
  id: string;
  name: string;
  number?: number;
  team: Team;
  preferredPosition: Position;
  attack: number;
  defense: number;
  stamina: number;
  finishing: number;
  passing: number;
  goalkeeping: number;
  magic: number;
  grit: number;
  chaos: number;
  starter: boolean;
  goalkeeper: boolean;
  traits?: PlayerTrait[];
}

export const POSITION_LABELS: Record<Position, string> = {
  GK: "Arquero",
  DEF: "Defensa",
  MID: "Mediocampista",
  FWD: "Delantero",
  ALL: "Polifuncional",
};

export const TEAM_LABELS: Record<Team, string> = {
  cerro: "Cerro",
  olimpia: "Olimpia",
  undecided: "Sin definir",
};

export const ATTRIBUTE_FIELDS = [
  ["attack", "Ataque"],
  ["defense", "Defensa"],
  ["stamina", "Resistencia"],
  ["finishing", "Definición"],
  ["passing", "Pase"],
  ["goalkeeping", "Arco"],
  ["magic", "Magia"],
  ["grit", "Huevo"],
  ["chaos", "Cagada"],
] as const satisfies ReadonlyArray<readonly [keyof Player, string]>;
