export type SocialSection = "home" | "players" | "scouting" | "teams" | "match";
export type SimulationSpeed = "normal" | "fast" | "instant";

const TAB_KEY = "superclasico-f5:last-tab";
const SPEED_KEY = "superclasico-f5:speed";

export const preferences = {
  loadTab(): SocialSection {
    try { const value = window.localStorage.getItem(TAB_KEY); return (["home", "players", "scouting", "teams", "match"] as string[]).includes(value ?? "") ? value as SocialSection : "home"; } catch { return "home"; }
  },
  saveTab(value: SocialSection) { try { window.localStorage.setItem(TAB_KEY, value); } catch { /* preference only */ } },
  loadSpeed(): SimulationSpeed {
    try { const value = window.localStorage.getItem(SPEED_KEY); return (["normal", "fast", "instant"] as string[]).includes(value ?? "") ? value as SimulationSpeed : "normal"; } catch { return "normal"; }
  },
  saveSpeed(value: SimulationSpeed) { try { window.localStorage.setItem(SPEED_KEY, value); } catch { /* preference only */ } },
};
