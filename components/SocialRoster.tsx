import type { Player } from "../types/player";
import { ShareButton } from "./ShareButton";
import { SocialPlayerCard } from "./SocialPlayerCard";
import { TeamLogo } from "./TeamLogo";

export function SocialRoster({ players, userId, onEditMine }: { players: Player[]; userId: string; onEditMine: () => void }) {
  const mine = players.find((player) => player.ownerUserId === userId);
  return (
    <div className="space-y-5">
      {mine && <section className="rounded-[1.7rem] border border-[#f2bd45]/20 bg-[#f2bd45]/[0.06] p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#f2bd45]">Mi jugador</p><h2 className="font-display text-3xl uppercase">{mine.name}</h2></div><button onClick={onEditMine} className="min-h-11 rounded-xl bg-white px-4 text-xs font-black text-[#111827]">Editar</button></div></section>}
      <div className="grid gap-4 xl:grid-cols-2"><TeamSection team="cerro" players={players.filter((player) => player.team === "cerro")} /><TeamSection team="olimpia" players={players.filter((player) => player.team === "olimpia")} /></div>
      {players.some((player) => player.team === "undecided") && <section><h2 className="font-display mb-3 text-3xl uppercase text-[#c2cad7]">Todavía sin camiseta</h2><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{players.filter((player) => player.team === "undecided").map((player) => <SocialPlayerCard key={player.id} player={player} />)}</div></section>}
    </div>
  );
}

function TeamSection({ team, players }: { team: "cerro" | "olimpia"; players: Player[] }) {
  const names = players.map((player) => `${player.goalkeeper ? "🧤" : player.preferredPosition === "DEF" ? "🛡" : player.preferredPosition === "FWD" ? "🎯" : "⚙"} ${player.name}`).join("\n");
  const message = `${team === "cerro" ? "🔵🔴 CERRO" : "⚪⚫ OLIMPIA"} · CONVOCADOS\n\n${names || "Todavía sin jugadores"}\n\n🔥 La previa ya empezó.`;
  return <section className={`rounded-[1.8rem] border p-4 ${team === "cerro" ? "border-blue-500/20 bg-blue-500/[0.05]" : "border-white/10 bg-white/[0.03]"}`}><div className="mb-4 flex items-center gap-3"><TeamLogo team={team} size="md" /><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8493aa]">Convocados</p><h2 className="font-display text-3xl uppercase leading-none">{team === "cerro" ? "Cerro Porteño" : "Olimpia"}</h2></div><span className="ml-auto rounded-full bg-white/8 px-3 py-1 text-xs font-black">{players.length}</span></div>{players.length ? <div className="grid gap-3">{players.map((player) => <SocialPlayerCard key={player.id} player={player} />)}</div> : <p className="rounded-2xl border border-dashed border-white/10 p-7 text-center text-sm text-[#7d8ca3]">Este vestuario todavía está vacío.</p>}<ShareButton title={`${team === "cerro" ? "Cerro" : "Olimpia"} · Superclásico F5`} text={message} className="mt-3" /></section>;
}
