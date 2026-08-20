import type { MatchRoom } from "../types/social";
import type { Player } from "../types/player";
import { Countdown } from "./Countdown";
import { ShareButton } from "./ShareButton";
import { TeamLogo } from "./TeamLogo";

export function SocialHome({ match, players, myPlayer, onJoin, onViewPlayers }: { match: MatchRoom; players: Player[]; myPlayer?: Player; onJoin: () => void; onViewPlayers: () => void }) {
  const cerro = players.filter((player) => player.team === "cerro").length;
  const olimpia = players.filter((player) => player.team === "olimpia").length;
  const matchDate = match.matchDate ? new Date(match.matchDate) : null;
  const dateText = matchDate ? new Intl.DateTimeFormat("es-PY", { weekday: "long", day: "numeric", month: "long" }).format(matchDate) : "Fecha a confirmar";
  const timeText = matchDate ? new Intl.DateTimeFormat("es-PY", { hour: "2-digit", minute: "2-digit" }).format(matchDate) : "Hora a confirmar";
  const shareText = `🔥 SUPERCLÁSICO F5\n\nCERRO 🔵🔴 vs OLIMPIA ⚪⚫\n\n${myPlayer ? `${myPlayer.name} ya se anotó por ${myPlayer.team === "cerro" ? "Cerro" : myPlayer.team === "olimpia" ? "Olimpia" : "definir"}.` : "La convocatoria está abierta."}\n\n¿De qué lado jugás?`;
  return (
    <div className="space-y-4">
      <section className="stadium-glow relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_50%_-15%,#193864_0%,#0d192b_43%,#080f1b_100%)] px-4 pb-7 pt-6 shadow-2xl shadow-black/40 sm:px-8 sm:py-9">
        <div className="absolute left-0 top-0 h-full w-1/3 bg-red-600/[0.06] blur-3xl" /><div className="absolute right-0 top-0 h-full w-1/3 bg-white/[0.04] blur-3xl" />
        <p className="relative text-center text-[10px] font-black uppercase tracking-[0.38em] text-[#f2bd45]">La previa digital entre amigos</p>
        <h1 className="font-display relative mt-2 text-center text-5xl uppercase leading-none tracking-tight sm:text-7xl">Superclásico F5</h1>
        <div className="relative mx-auto mt-7 grid max-w-2xl grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-7">
          <TeamHero team="cerro" count={cerro} />
          <div className="text-center"><span className="font-display block text-5xl text-[#56647a] sm:text-7xl">VS</span><span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#77869d]">40 minutos</span></div>
          <TeamHero team="olimpia" count={olimpia} />
        </div>
        <div className="relative mx-auto mt-7 max-w-xl rounded-2xl border border-white/10 bg-black/20 p-4 text-center"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7f8ea5]">Matchday</p><p className="font-display mt-1 text-2xl uppercase sm:text-3xl">{dateText} · {timeText}</p><p className="mt-1 text-xs font-semibold text-[#9aa7b9]">📍 {match.venue || "Lugar a confirmar"}</p></div>
        {match.matchDate && <div className="relative mx-auto mt-4 max-w-md"><Countdown target={match.matchDate} /></div>}
        <button onClick={onJoin} className="relative mt-5 min-h-16 w-full rounded-2xl bg-[#f2bd45] px-5 text-base font-black uppercase text-[#101522] shadow-xl shadow-[#f2bd45]/10 transition hover:-translate-y-0.5">{myPlayer ? "Editar mi jugador" : "⚽ Anotarme al partido"}</button>
        <button onClick={onViewPlayers} className="relative mt-2 min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] text-sm font-extrabold text-white">Ver {players.length} convocados</button>
        <p className="relative mx-auto mt-5 max-w-lg text-center text-sm font-semibold leading-relaxed text-[#aab5c7]">“90 años de rivalidad. 40 minutos de dudosa calidad futbolística.”</p>
      </section>
      <ShareButton title="Superclásico F5" text={shareText} />
    </div>
  );
}

function TeamHero({ team, count }: { team: "cerro" | "olimpia"; count: number }) {
  return <div className="min-w-0 text-center"><TeamLogo team={team} size="xl" className="mx-auto" /><h2 className="font-display mt-3 truncate text-3xl uppercase leading-none sm:text-5xl">{team === "cerro" ? "Cerro" : "Olimpia"}</h2><p className="mt-1 text-[10px] font-black uppercase tracking-wider text-[#8d9bb0]">{count} convocados</p></div>;
}
