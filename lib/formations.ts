import type { FormationId } from "../types/match";

export interface PitchPosition { x: number; y: number }

export const FORMATIONS: Record<FormationId, { label: string; description: string; positions: PitchPosition[] }> = {
  "1-2-1": {
    label: "1–2–1",
    description: "Equilibrio clásico",
    positions: [{ x: 50, y: 88 }, { x: 50, y: 69 }, { x: 25, y: 45 }, { x: 75, y: 45 }, { x: 50, y: 19 }],
  },
  "2-1-1": {
    label: "2–1–1",
    description: "Cuidar la casa",
    positions: [{ x: 50, y: 88 }, { x: 27, y: 67 }, { x: 73, y: 67 }, { x: 50, y: 43 }, { x: 50, y: 18 }],
  },
  "1-1-2": {
    label: "1–1–2",
    description: "Presión arriba",
    positions: [{ x: 50, y: 88 }, { x: 50, y: 68 }, { x: 50, y: 45 }, { x: 27, y: 20 }, { x: 73, y: 20 }],
  },
  "2-2": {
    label: "2–2",
    description: "Dos líneas claras",
    positions: [{ x: 50, y: 88 }, { x: 28, y: 65 }, { x: 72, y: 65 }, { x: 28, y: 25 }, { x: 72, y: 25 }],
  },
  "all-up": {
    label: "Todos arriba",
    description: "Defender es cobardía",
    positions: [{ x: 50, y: 88 }, { x: 16, y: 22 }, { x: 38, y: 16 }, { x: 62, y: 16 }, { x: 84, y: 22 }],
  },
};

export const FORMATION_IDS = Object.keys(FORMATIONS) as FormationId[];
