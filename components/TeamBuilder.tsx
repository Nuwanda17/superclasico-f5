import { POSITION_LABELS, type Player } from "../types/player";
import type { FormationId } from "../types/match";
import { FootballPitch } from "./FootballPitch";
import { FormationSelector } from "./FormationSelector";
import { TeamLogo } from "./TeamLogo";
import { ShareButton } from "./ShareButton";

interface TeamBuilderProps {
  players: Player[];
  formations: { cerro: FormationId; olimpia: FormationId };
  viewTeam: "cerro" | "olimpia";
  onViewTeam: (team: "cerro" | "olimpia") => void;
  onFormationChange: (team: "cerro" | "olimpia", formation: FormationId) => void | Promise<unknown>;
  onToggleStarter: (player: Player) => void | Promise<unknown>;
  onGoalkeeper: (player: Player) => void | Promise<unknown>;
  pendingKey?: string | null;
  message?: string;
}

export function TeamBuilder({ players, formations, viewTeam, onViewTeam, onFormationChange, onToggleStarter, onGoalkeeper, pendingKey, message }: TeamBuilderProps) {
  const teamPlayers = players.filter((player) => player.team === viewTeam);
  const starterCount = teamPlayers.filter((player) => player.starter).length;
  return (
    <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(20rem,0.9fr)_minmax(22rem,1.1fr)]">
      <section className="min-w-0 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0d192b] p-4 lg:sticky lg:top-4">
        <div className="mb-4 grid grid-cols-2 rounded-xl bg-black/20 p-1">
          {(["cerro", "olimpia"] as const).map((team) => <button key={team} onClick={() => onViewTeam(team)} className={`min-h-11 rounded-lg text-xs font-black uppercase italic transition ${viewTeam === team ? team === "cerro" ? "bg-[#1749a6] text-white" : "bg-white text-[#121827]" : "text-[#6e809b]"}`}>{team === "cerro" ? "Cerro" : "Olimpia"}</button>)}
        </div>
        <FootballPitch players={players} team={viewTeam} formation={formations[viewTeam]} />
      </section>

      <section className="min-w-0 space-y-4 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0d192b] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><TeamLogo team={viewTeam} size="sm" /><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#71819a]">Cinco valientes</p><h2 className="font-display text-2xl uppercase leading-none">{viewTeam === "cerro" ? "Cerro Porteño" : "Olimpia"}</h2></div></div><span className={`rounded-full px-3 py-1.5 text-xs font-black ${starterCount === 5 ? "bg-emerald-400/15 text-emerald-300" : "bg-[#efb73e]/10 text-[#efc867]"}`}>Titulares {starterCount}/5</span></div>
        {message && <p role="status" className="rounded-xl border border-amber-300/20 bg-amber-300/[0.06] px-3 py-2 text-xs font-bold text-amber-100">{message}</p>}
        <FormationSelector value={formations[viewTeam]} disabled={Boolean(pendingKey)} onChange={(formation) => onFormationChange(viewTeam, formation)} />
        <div className="space-y-2">
          {teamPlayers.map((player) => (
            <article key={player.id} className={`flex min-w-0 items-center gap-2 rounded-2xl border p-2.5 sm:gap-3 sm:p-3 ${player.starter ? "border-emerald-400/20 bg-emerald-400/[0.05]" : "border-white/10 bg-white/[0.025]"}`}>
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-black ${viewTeam === "cerro" ? "bg-[#1749a6] ring-2 ring-[#e93242]" : "bg-[#171b24] ring-2 ring-white"}`}>{player.number ?? player.name[0]}</div>
              <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-black">{player.name}</h3><p className="text-[9px] font-bold uppercase tracking-wider text-[#71819a]">{POSITION_LABELS[player.preferredPosition]}</p></div>
              <button disabled={!player.starter || Boolean(pendingKey)} onClick={() => onGoalkeeper(player)} className={`min-h-10 shrink-0 rounded-xl px-2 text-[9px] font-black disabled:opacity-40 sm:px-2.5 sm:text-[10px] ${player.goalkeeper ? "bg-[#efb73e] text-[#111827]" : "bg-white/5 text-[#8e9ab0]"}`} aria-pressed={player.goalkeeper}>🧤 {player.goalkeeper ? "Arquero" : "Al arco"}</button>
              <button disabled={Boolean(pendingKey) || (!player.starter && starterCount >= 5)} onClick={() => onToggleStarter(player)} className={`min-h-10 shrink-0 rounded-xl px-2 text-[9px] font-black uppercase disabled:opacity-40 sm:px-3 sm:text-[10px] ${player.starter ? "bg-emerald-400 text-[#082116]" : "bg-white/10 text-white"}`} aria-pressed={player.starter}>{player.starter ? "Titular" : "Suplente"}</button>
            </article>
          ))}
          {teamPlayers.length === 0 && <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-[#7585a0]">Primero asigná jugadores a este equipo.</p>}
        </div>
        <TeamShare team={viewTeam} players={teamPlayers.filter((player) => player.starter)} formation={formations[viewTeam]} />
      </section>
    </div>
  );
}

function TeamShare({ team, players, formation }: { team: "cerro" | "olimpia"; players: Player[]; formation: FormationId }) {
  if (players.length !== 5) return null;
  const names = [...players].sort((a, b) => Number(b.goalkeeper) - Number(a.goalkeeper)).map((player) => `${player.goalkeeper ? "🧤" : player.preferredPosition === "DEF" ? "🛡" : player.preferredPosition === "FWD" ? "🎯" : "⚙"} ${player.name}`).join("\n");
  const text = `${team === "cerro" ? "🔵🔴 CERRO CONFIRMADO" : "⚪⚫ OLIMPIA CONFIRMADO"}\n\n${names}\n\nFormación ${formation}\n\n🔥 ${team === "cerro" ? "El Ciclón" : "El Decano"} está listo.`;
  return <ShareButton title={`${team === "cerro" ? "Cerro" : "Olimpia"} confirmado`} text={text} />;
}
