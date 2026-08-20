"use client";

import { useState } from "react";
import { validatePlayerProfile } from "../lib/playerValidation";
import { POSITION_LABELS, TEAM_LABELS, type Player, type Position, type Team } from "../types/player";
import type { PlayerProfileInput } from "../types/social";

export function MyPlayerForm({ initial, pending, onSave, onCancel }: { initial?: Player; pending: boolean; onSave: (input: PlayerProfileInput) => Promise<boolean>; onCancel: () => void }) {
  const [input, setInput] = useState<PlayerProfileInput>({ name: initial?.name ?? "", number: initial?.number, team: initial?.team ?? "undecided", preferredPosition: initial?.preferredPosition ?? "ALL" });
  const [errors, setErrors] = useState<string[]>([]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = validatePlayerProfile(input);
    if (!result.value) { setErrors(result.errors); return; }
    setErrors([]);
    if (await onSave(result.value)) onCancel();
  };
  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-[#03070f]/92 p-3 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="my-player-title">
      <form onSubmit={submit} className="mx-auto my-5 max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-[#101a2a] shadow-2xl">
        <div className="border-b border-white/8 bg-[linear-gradient(135deg,#153f91_0%,#101a2a_52%,#36121a_100%)] p-5">
          <div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#f3c04f]">Tu lugar en la previa</p><h2 id="my-player-title" className="font-display mt-1 text-4xl uppercase leading-none">{initial ? "Editar mi jugador" : "Anotarme"}</h2></div><button type="button" onClick={onCancel} aria-label="Cerrar formulario" className="grid min-h-11 min-w-11 place-items-center rounded-full bg-black/20 text-xl">×</button></div>
          <p className="mt-3 text-sm text-[#c2cbe0]">Vos elegís quién sos. Tus amigos deciden qué tan bueno sos.</p>
        </div>
        <div className="space-y-4 p-5">
          <Field label="Nombre o apodo"><input required minLength={2} maxLength={30} value={input.name} onChange={(event) => setInput({ ...input, name: event.target.value })} placeholder="Ej: Ricardo" className="control" /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Equipo"><select value={input.team} onChange={(event) => setInput({ ...input, team: event.target.value as Team })} className="control">{Object.entries(TEAM_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Número"><input inputMode="numeric" type="number" min={1} max={99} value={input.number ?? ""} onChange={(event) => setInput({ ...input, number: event.target.value === "" ? undefined : Number(event.target.value) })} placeholder="1–99" className="control" /></Field></div>
          <Field label="Posición preferida"><select value={input.preferredPosition} onChange={(event) => setInput({ ...input, preferredPosition: event.target.value as Position })} className="control">{Object.entries(POSITION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
          {errors.length > 0 && <div role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{errors.map((error) => <p key={error}>• {error}</p>)}</div>}
          <p className="rounded-xl bg-white/[0.04] p-3 text-xs leading-relaxed text-[#8f9eb5]">Los atributos no se editan acá. Se revelan cuando al menos 3 compañeros te evalúen.</p>
          <button disabled={pending} className="min-h-14 w-full rounded-2xl bg-[#f2bd45] font-black uppercase text-[#101522] disabled:opacity-50">{pending ? "Guardando…" : initial ? "Guardar cambios" : "Confirmar convocatoria"}</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.16em] text-[#8796ad]">{label}</span>{children}</label>; }
