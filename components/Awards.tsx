import type { MatchResult } from "../types/match";
import type { Player } from "../types/player";

export function Awards({ result, players }: { result: MatchResult; players: Player[] }) {
  return (
    <section>
      <div className="mb-3"><p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#efb73e]">Ceremonia de dudoso prestigio</p><h2 className="text-2xl font-black uppercase italic">Premios del partido</h2></div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {result.awards.map((award, index) => {
          const player = players.find((item) => item.id === award.playerId);
          return <article key={award.key} className={`rounded-2xl border p-4 ${index === 0 ? "border-[#efb73e]/40 bg-[#efb73e]/10 sm:col-span-2 xl:col-span-1" : "border-white/10 bg-[#0d192b]"}`}><div className="flex items-center gap-3"><span className="text-2xl" aria-hidden="true">{award.emoji}</span><div><p className="text-[9px] font-black uppercase tracking-wider text-[#7585a0]">{award.title}</p><h3 className="text-lg font-black italic">{player?.name ?? "—"}</h3></div></div><p className="mt-3 text-xs leading-relaxed text-[#9eabc0]">{award.reason}</p></article>;
        })}
      </div>
    </section>
  );
}
