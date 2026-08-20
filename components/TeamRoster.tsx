import type { Player, Team } from "../types/player";
import { PlayerCard } from "./PlayerCard";

interface TeamRosterProps {
  players: Player[];
  onEdit: (player: Player) => void;
  onDelete: (player: Player) => void;
  onTeamChange: (player: Player, team: Team) => void;
}

export function TeamRoster(props: TeamRosterProps) {
  const cerro = props.players.filter((player) => player.team === "cerro");
  const olimpia = props.players.filter((player) => player.team === "olimpia");
  const undecided = props.players.filter((player) => player.team === "undecided");
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <RosterSection {...props} team="cerro" players={cerro} />
      <RosterSection {...props} team="olimpia" players={olimpia} />
      {undecided.length > 0 && (
        <section className="rounded-[1.75rem] border border-dashed border-amber-300/20 bg-amber-300/[0.03] p-4 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-black uppercase italic text-amber-200">Sin definir</h2><span className="rounded-full bg-amber-200/10 px-3 py-1 text-xs font-bold text-amber-100">{undecided.length}</span></div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{undecided.map((player) => <PlayerCard key={player.id} player={player} compact onEdit={props.onEdit} onDelete={props.onDelete} onTeamChange={props.onTeamChange} />)}</div>
        </section>
      )}
    </div>
  );
}

function RosterSection({ team, players, ...actions }: TeamRosterProps & { team: Exclude<Team, "undecided"> }) {
  const isCerro = team === "cerro";
  return (
    <section className={`rounded-[1.75rem] border p-4 ${isCerro ? "border-blue-500/20 bg-blue-600/[0.05]" : "border-white/10 bg-white/[0.03]"}`}>
      <div className="mb-3 flex items-center justify-between"><div><p className={`text-[9px] font-black uppercase tracking-[0.25em] ${isCerro ? "text-[#5e91ff]" : "text-[#929db0]"}`}>Convocados</p><h2 className="text-xl font-black uppercase italic">{isCerro ? "Cerro Porteño" : "Olimpia"}</h2></div><span className={`rounded-full px-3 py-1 text-xs font-black ${isCerro ? "bg-blue-500/15 text-blue-200" : "bg-white/10"}`}>{players.length}</span></div>
      <div className="grid gap-2">{players.map((player) => <PlayerCard key={player.id} player={player} onEdit={actions.onEdit} onDelete={actions.onDelete} onTeamChange={actions.onTeamChange} />)}{players.length === 0 && <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-[#7687a2]">Todavía no hay jugadores de este lado.</p>}</div>
    </section>
  );
}
