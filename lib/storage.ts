import type { Player } from "../types/player";
import type { FormationId, MatchConfig, MatchResult, Prediction, RealResult } from "../types/match";

export interface AppData {
  players: Player[];
  config: MatchConfig;
  formations: { cerro: FormationId; olimpia: FormationId };
  predictions: Prediction[];
  lastMatch: MatchResult | null;
  realResult: RealResult | null;
}

const STORAGE_KEY = "superclasico-f5-v1";

export const DEFAULT_CONFIG: MatchConfig = {
  date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  time: "20:30",
  place: "La canchita",
};

export const EMPTY_APP_DATA: AppData = {
  players: [],
  config: DEFAULT_CONFIG,
  formations: { cerro: "1-2-1", olimpia: "2-1-1" },
  predictions: [],
  lastMatch: null,
  realResult: null,
};

function isAppData(value: unknown): value is AppData {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<AppData>;
  return Array.isArray(data.players) && typeof data.config === "object" && data.config !== null;
}

export const storage = {
  load(): AppData {
    if (typeof window === "undefined") return EMPTY_APP_DATA;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return EMPTY_APP_DATA;
      const parsed: unknown = JSON.parse(raw);
      if (!isAppData(parsed)) return EMPTY_APP_DATA;
      return { ...EMPTY_APP_DATA, ...parsed, formations: { ...EMPTY_APP_DATA.formations, ...parsed.formations } };
    } catch {
      return EMPTY_APP_DATA;
    }
  },
  save(data: AppData): void {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* Storage can be unavailable in private mode. */ }
  },
  clear(): void {
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  },
};
