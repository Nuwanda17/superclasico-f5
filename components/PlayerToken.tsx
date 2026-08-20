import type { Player } from "../types/player";

export function PlayerToken({ player, team, x, y }: { player: Player; team: "cerro" | "olimpia"; x: number; y: number }) {
  const isCerro = team === "cerro";
  return (
    <div className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition-all duration-500" style={{ left: `${x}%`, top: `${y}%` }}>
      <div className={`relative grid h-12 w-12 place-items-center rounded-full border-[3px] text-sm font-black shadow-xl sm:h-14 sm:w-14 ${isCerro ? "border-[#ed3748] bg-[#194da9] shadow-blue-950/70" : "border-white bg-[#151921] shadow-black/60"}`}>
        {player.number ?? player.name.slice(0, 1).toUpperCase()}
        {player.goalkeeper && <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#efb73e] text-[10px] text-[#121827]" aria-label="Arquero">G</span>}
      </div>
      <span className="mt-1 max-w-[5.5rem] truncate rounded-md bg-[#07101f]/90 px-1.5 py-0.5 text-[9px] font-black uppercase shadow-md sm:text-[10px]">{player.name}</span>
    </div>
  );
}
