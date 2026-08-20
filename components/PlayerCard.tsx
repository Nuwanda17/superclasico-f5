import { POSITION_LABELS, type Player, type Team } from "../types/player";

interface PlayerCardProps {
  player: Player;
  compact?: boolean;
  onEdit: (player: Player) => void;
  onDelete: (player: Player) => void;
  onTeamChange: (player: Player, team: Team) => void;
}

export function PlayerCard({ player, compact = false, onEdit, onDelete, onTeamChange }: PlayerCardProps) {
  const initials = player.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const color = player.team === "cerro" ? "border-blue-500/30 bg-blue-500/10" : player.team === "olimpia" ? "border-white/15 bg-white/[0.06]" : "border-amber-400/20 bg-amber-400/[0.06]";
  return (
    <article className={`rounded-2xl border p-3 ${color}`}>
      <div className="flex items-center gap-3">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-xs font-black ${player.team === "cerro" ? "bg-[#1749a6] ring-2 ring-[#e93242]" : player.team === "olimpia" ? "bg-[#151921] ring-2 ring-white" : "bg-[#273247] ring-2 ring-[#66758e]"}`}>{initials}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><h3 className="truncate font-black">{player.name}</h3>{player.number && <span className="text-xs font-black text-[#f2c15b]">#{player.number}</span>}</div>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8290a8]">{POSITION_LABELS[player.preferredPosition]}</p>
        </div>
        <button onClick={() => onEdit(player)} aria-label={`Editar a ${player.name}`} className="grid min-h-10 min-w-10 place-items-center rounded-xl bg-white/5 text-sm hover:bg-white/10">✎</button>
      </div>
      {!compact && (
        <div className="mt-3 grid grid-cols-4 gap-1 text-center">
          <Stat label="ATA" value={player.attack} /><Stat label="DEF" value={player.defense} /><Stat label="PAS" value={player.passing} /><Stat label="MAG" value={player.magic} />
        </div>
      )}
      <div className="mt-3 flex gap-2">
        <select aria-label={`Cambiar equipo de ${player.name}`} value={player.team} onChange={(event) => onTeamChange(player, event.target.value as Team)} className="min-h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#101b2d] px-2 text-xs font-bold text-white">
          <option value="cerro">Cerro</option><option value="olimpia">Olimpia</option><option value="undecided">Sin definir</option>
        </select>
        <button onClick={() => onDelete(player)} aria-label={`Eliminar a ${player.name}`} className="min-h-10 rounded-xl px-3 text-xs font-bold text-[#ef7f88] hover:bg-red-500/10">Eliminar</button>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg bg-black/20 px-1 py-1.5"><span className="block text-[8px] font-bold text-[#6f809b]">{label}</span><strong className="text-xs">{value}</strong></div>;
}
