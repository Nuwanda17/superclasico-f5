"use client";

import { useState } from "react";
import { validateRating } from "../lib/playerValidation";
import { COMMUNITY_TRAITS, type RatingInput, type RatingRecord } from "../types/social";
import type { Player } from "../types/player";

const DEFAULT_RATING: RatingInput = { technique: 6, finishing: 6, passing: 6, defense: 6, stamina: 6, goalkeeping: 5, magic: 6, grit: 7, hype: 6, chaos: 5, trait: null };
const FIELDS: Array<[keyof Omit<RatingInput, "trait">, string, string]> = [
  ["technique", "Técnica", "Control y calidad con la pelota"], ["finishing", "Definición", "Cuando queda frente al arco"],
  ["passing", "Pase", "Ve y ejecuta la jugada"], ["defense", "Defensa", "Marca, anticipa y recupera"],
  ["stamina", "Resistencia", "Cuánto dura el combustible"], ["goalkeeping", "Arquero", "Qué tan confiable es bajo palos"],
  ["magic", "Magia", "Capacidad de inventar algo"], ["grit", "Huevo", "Cuánto mete cuando quema"],
  ["hype", "Humo", "Promesa, relato y autopromoción"], ["chaos", "Caos", "Probabilidad de que pase cualquier cosa"],
];

export function RatingForm({ player, initial, pending, onSave, onCancel }: { player: Player; initial?: RatingRecord; pending: boolean; onSave: (input: RatingInput) => Promise<boolean>; onCancel: () => void }) {
  const [rating, setRating] = useState<RatingInput>(() => initial ? { technique: initial.technique, finishing: initial.finishing, passing: initial.passing, defense: initial.defense, stamina: initial.stamina, goalkeeping: initial.goalkeeping, magic: initial.magic, grit: initial.grit, hype: initial.hype, chaos: initial.chaos, trait: initial.trait } : DEFAULT_RATING);
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = validateRating(rating);
    if (!result.value) { setError("Todos los puntajes deben estar entre 1 y 10."); return; }
    if (await onSave(result.value)) onCancel();
  };
  const update = (field: keyof Omit<RatingInput, "trait">, value: number) => setRating((current) => ({ ...current, [field]: value }));
  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#03070f]/94 p-3 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="rating-title">
      <form onSubmit={submit} className="mx-auto my-4 max-w-xl rounded-[2rem] border border-white/10 bg-[#101a2a] p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f2bd45]">Informe confidencial*</p><h2 id="rating-title" className="font-display mt-1 text-4xl uppercase leading-none">Evaluar a {player.name}</h2><p className="mt-2 text-xs text-[#8291a9]">*Nadie verá quién puso cada nota.</p></div><button type="button" onClick={onCancel} aria-label="Cerrar evaluación" className="grid min-h-11 min-w-11 place-items-center rounded-full bg-white/5 text-xl">×</button></div>
        <div className="mt-5 space-y-4">{FIELDS.map(([field, label, hint]) => <label key={field} className="block"><span className="flex items-end justify-between gap-3"><span><strong className="block text-sm">{label}</strong><small className="text-[10px] text-[#74849c]">{hint}</small></span><strong className="font-display rounded-lg bg-[#f2bd45] px-2.5 py-1 text-xl text-[#111827]">{rating[field]}</strong></span><input type="range" min={1} max={10} step={1} value={rating[field]} onChange={(event) => update(field, Number(event.target.value))} aria-label={`${label}: ${rating[field]} de 10`} className="rating-slider mt-2 w-full" /></label>)}</div>
        <label className="mt-6 block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.16em] text-[#8796ad]">Un rasgo que lo define</span><select value={rating.trait ?? ""} onChange={(event) => setRating({ ...rating, trait: (event.target.value || null) as RatingInput["trait"] })} className="control"><option value="">Sin rasgo</option>{COMMUNITY_TRAITS.map((trait) => <option key={trait} value={trait}>{trait}</option>)}</select></label>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
        <button disabled={pending} className="mt-5 min-h-14 w-full rounded-2xl bg-[#f2bd45] font-black uppercase text-[#101522] disabled:opacity-50">{pending ? "Enviando informe…" : initial ? "Actualizar mi evaluación" : "Enviar evaluación"}</button>
      </form>
    </div>
  );
}
