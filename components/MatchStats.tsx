import type { MatchResult } from "../types/match";
import type { Player } from "../types/player";

export function MatchStats({ result, players }: { result: MatchResult; players: Player[] }) {
  const rows = [
    ["Tiros", result.teamStats.cerro.shots, result.teamStats.olimpia.shots],
    ["Al arco", result.teamStats.cerro.shotsOnTarget, result.teamStats.olimpia.shotsOnTarget],
    ["Posesión", `${result.possession.cerro}%`, `${result.possession.olimpia}%`],
    ["Atajadas", result.teamStats.cerro.saves, result.teamStats.olimpia.saves],
    ["Recuperaciones", result.teamStats.cerro.tackles, result.teamStats.olimpia.tackles],
    ["Errores", result.teamStats.cerro.errors, result.teamStats.olimpia.errors],
    ["Tarjetas", result.teamStats.cerro.cards, result.teamStats.olimpia.cards],
  ];
  const leaders = [...result.playerStats].sort((a, b) => b.rating - a.rating).slice(0, 6);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-[1.75rem] border border-white/10 bg-[#0d192b] p-4 sm:p-5">
        <div className="mb-4 grid grid-cols-[1fr_1.2fr_1fr] text-center text-[10px] font-black uppercase tracking-wider"><span className="text-blue-300">Cerro</span><span className="text-[#71819a]">Partido</span><span>Olimpia</span></div>
        <div className="space-y-1">{rows.map(([label, cerro, olimpia]) => <div key={String(label)} className="grid grid-cols-[1fr_1.2fr_1fr] items-center rounded-xl bg-white/[0.025] px-3 py-2.5 text-center"><strong className="font-mono">{cerro}</strong><span className="text-[10px] font-bold uppercase text-[#71819a]">{label}</span><strong className="font-mono">{olimpia}</strong></div>)}</div>
      </section>
      <section className="rounded-[1.75rem] border border-white/10 bg-[#0d192b] p-4 sm:p-5">
        <h3 className="text-sm font-black uppercase italic">Rendimientos</h3>
        <div className="mt-3 space-y-2">{leaders.map((stats, index) => { const player = players.find((item) => item.id === stats.playerId); if (!player) return null; return <div key={stats.playerId} className="grid grid-cols-[1.7rem_1fr_auto] items-center gap-2 rounded-xl bg-white/[0.03] p-2.5"><span className="text-center text-xs font-black text-[#65758f]">{index + 1}</span><div className="min-w-0"><p className="truncate text-sm font-black">{player.name}</p><p className="text-[9px] font-semibold text-[#7585a0]">{stats.goals} G · {stats.assists} A · {stats.saves} ATAJ</p></div><strong className={`grid h-9 w-9 place-items-center rounded-full text-xs ${stats.rating >= 7.5 ? "bg-emerald-400 text-[#082116]" : "bg-[#26344a]"}`}>{stats.rating.toFixed(1)}</strong></div>; })}</div>
      </section>
    </div>
  );
}
