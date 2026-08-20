import type { Player } from "../types/player";
import type { RatingRecord } from "../types/social";
import { SocialPlayerCard } from "./SocialPlayerCard";

export function ScoutingPanel({ players, userId, myRatings, onRate }: { players: Player[]; userId: string; myRatings: Record<string, RatingRecord>; onRate: (player: Player) => void }) {
  const eligible = players.filter((player) => player.ownerUserId !== userId);
  const mine = players.find((player) => player.ownerUserId === userId);
  return (
    <div className="space-y-5">
      {mine && <section><div className="mb-3"><p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#f2bd45]">Lo que dicen de vos</p><h2 className="font-display text-4xl uppercase leading-none">Mi carta</h2></div><div className="max-w-md"><SocialPlayerCard player={mine} isMine /></div></section>}
      <section><div className="mb-3"><p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#f2bd45]">Sin revelar nombres de scouts</p><h2 className="font-display text-4xl uppercase leading-none">Evaluá a la banda</h2><p className="mt-2 max-w-xl text-sm text-[#8998af]">Podés votar una vez por jugador y actualizar tu informe cuando quieras.</p></div>
        {eligible.length === 0 ? <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-[#7e8da5]">Todavía no hay compañeros para evaluar.</p> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{eligible.map((player) => <SocialPlayerCard key={player.id} player={player} actionLabel={myRatings[player.id] ? "✓ Editar mi evaluación" : "Evaluar jugador"} onAction={() => onRate(player)} />)}</div>}
      </section>
    </div>
  );
}
