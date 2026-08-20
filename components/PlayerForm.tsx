"use client";

import { useState } from "react";
import { ATTRIBUTE_FIELDS, POSITION_LABELS, TEAM_LABELS, type Player, type Position, type Team } from "../types/player";

const freshPlayer = (): Player => ({
  id: `player-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: "",
  team: "undecided",
  preferredPosition: "ALL",
  attack: 3, defense: 3, stamina: 3, finishing: 3, passing: 3, goalkeeping: 1, magic: 3, grit: 3, chaos: 3,
  starter: false,
  goalkeeper: false,
  traits: [],
});

export function PlayerForm({ initial, onSave, onCancel }: { initial?: Player; onSave: (player: Player) => void; onCancel: () => void }) {
  const [player, setPlayer] = useState<Player>(() => initial ? { ...initial } : freshPlayer());
  const update = <K extends keyof Player>(field: K, value: Player[K]) => setPlayer((current) => ({ ...current, [field]: value }));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!player.name.trim()) return;
    onSave({ ...player, name: player.name.trim(), goalkeeper: player.preferredPosition === "GK" ? player.goalkeeper : player.goalkeeper });
  };
  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#050a12]/90 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-labelledby="player-form-title">
      <form onSubmit={submit} className="mx-auto my-3 max-w-2xl rounded-[1.75rem] border border-white/10 bg-[#101b2d] p-4 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f2c15b]">Ficha técnica no auditada</p>
            <h2 id="player-form-title" className="mt-1 text-2xl font-black italic">{initial ? "Editar jugador" : "Nuevo jugador"}</h2>
          </div>
          <button type="button" onClick={onCancel} aria-label="Cerrar" className="grid min-h-11 min-w-11 place-items-center rounded-full bg-white/5 text-xl text-[#8796ae] hover:bg-white/10">×</button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field label="Nombre *"><input required value={player.name} onChange={(event) => update("name", event.target.value)} placeholder="Ej: El Tanque" className="control" /></Field>
          <Field label="Número"><input type="number" min={1} max={99} value={player.number ?? ""} onChange={(event) => update("number", event.target.value ? Number(event.target.value) : undefined)} placeholder="1–99" className="control" /></Field>
          <Field label="Equipo"><select value={player.team} onChange={(event) => update("team", event.target.value as Team)} className="control">{Object.entries(TEAM_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
          <Field label="Posición preferida"><select value={player.preferredPosition} onChange={(event) => update("preferredPosition", event.target.value as Position)} className="control">{Object.entries(POSITION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
        </div>

        <div className="mt-6">
          <div className="flex items-end justify-between gap-4">
            <h3 className="text-sm font-black uppercase italic">Atributos</h3>
            <span className="text-[10px] text-[#71829c]">1 = humilde · 5 = fenómeno</span>
          </div>
          <div className="mt-3 grid gap-x-5 gap-y-4 sm:grid-cols-2">
            {ATTRIBUTE_FIELDS.map(([field, label]) => (
              <label key={field} className="block">
                <span className="flex items-center justify-between text-xs font-bold"><span>{label}</span><strong className="rounded-md bg-[#efb73e] px-2 py-0.5 text-[#111827]">{String(player[field])}</strong></span>
                <input aria-label={`${label}: ${player[field]} de 5`} type="range" min={1} max={5} step={1} value={Number(player[field])} onChange={(event) => update(field, Number(event.target.value) as Player[typeof field])} className="attribute-slider mt-2 w-full" />
              </label>
            ))}
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancel} className="min-h-12 rounded-2xl border border-white/10 font-bold text-[#a7b3c7] hover:bg-white/5">Cancelar</button>
          <button type="submit" className="min-h-12 rounded-2xl bg-[#efb73e] font-black uppercase italic text-[#111827] hover:bg-[#ffd068]">Guardar jugador</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-[#8190a9]">{label}</span>{children}</label>;
}
