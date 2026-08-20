import { FORMATIONS } from "../lib/formations";
import type { FormationId } from "../types/match";
import type { Player } from "../types/player";
import { PlayerToken } from "./PlayerToken";

export function FootballPitch({ players, team, formation }: { players: Player[]; team: "cerro" | "olimpia"; formation: FormationId }) {
  const starters = players.filter((player) => player.team === team && player.starter);
  const ordered = [...starters].sort((a, b) => Number(b.goalkeeper) - Number(a.goalkeeper));
  const positions = FORMATIONS[formation].positions;
  return (
    <div className="relative mx-auto aspect-[9/14] w-full max-w-[25rem] overflow-hidden rounded-[1.75rem] border-[5px] border-[#172a22] bg-[#176436] shadow-2xl shadow-black/40" aria-label={`Cancha de ${team === "cerro" ? "Cerro" : "Olimpia"}`}>
      <div className="absolute inset-0 pitch-stripes opacity-70" />
      <div className="absolute inset-[4%] rounded-sm border-2 border-white/60" />
      <div className="absolute left-[4%] right-[4%] top-1/2 h-0.5 bg-white/60" />
      <div className="absolute left-1/2 top-1/2 aspect-square w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/60" />
      <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />
      <div className="absolute left-1/2 top-[4%] h-[16%] w-[55%] -translate-x-1/2 border-2 border-t-0 border-white/60" />
      <div className="absolute bottom-[4%] left-1/2 h-[16%] w-[55%] -translate-x-1/2 border-2 border-b-0 border-white/60" />
      <div className="absolute left-1/2 top-[2%] h-[3%] w-[30%] -translate-x-1/2 border-2 border-white/70" />
      <div className="absolute bottom-[2%] left-1/2 h-[3%] w-[30%] -translate-x-1/2 border-2 border-white/70" />
      {ordered.map((player, index) => <PlayerToken key={player.id} player={player} team={team} x={positions[index]?.x ?? 50} y={positions[index]?.y ?? 50} />)}
      {starters.length === 0 && <div className="absolute inset-0 grid place-items-center"><p className="max-w-48 rounded-2xl bg-[#07101f]/80 p-4 text-center text-xs font-bold text-white">Elegí titulares y aparecerán en la cancha.</p></div>}
    </div>
  );
}
