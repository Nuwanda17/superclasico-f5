import type { MatchEvent } from "../types/match";
import { TeamLogo } from "./TeamLogo";

export function MatchScoreboard({ events, minute, final = false }: { events: MatchEvent[]; minute: number; final?: boolean }) {
  const cerro = events.filter((event) => (event.type === "goal" || event.type === "golazo") && event.team === "cerro").length;
  const olimpia = events.filter((event) => (event.type === "goal" || event.type === "golazo") && event.team === "olimpia").length;
  return (
    <div className="scoreboard rounded-[1.75rem] border border-white/10 bg-[#08111f] p-4 shadow-xl sm:p-6">
      <p className="text-center text-[9px] font-black uppercase tracking-[0.28em] text-[#efb73e]">{final ? "Final del partido" : minute === 0 ? "Todo listo" : minute <= 20 ? "Primer tiempo" : "Segundo tiempo"}</p>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
        <div><TeamLogo team="cerro" size="sm" className="mx-auto mb-2" /><strong className="text-xs font-black uppercase sm:text-base">Cerro</strong></div>
        <div className="font-display flex items-center gap-2 text-5xl tracking-tight sm:text-7xl"><span>{cerro}</span><span className="text-[#4d5a70]">–</span><span>{olimpia}</span></div>
        <div><TeamLogo team="olimpia" size="sm" className="mx-auto mb-2" /><strong className="text-xs font-black uppercase sm:text-base">Olimpia</strong></div>
      </div>
      <p className="mt-3 text-center font-mono text-xs font-bold text-[#71819a]">{final ? "40:00" : `${String(minute).padStart(2, "0")}:00`}</p>
    </div>
  );
}
