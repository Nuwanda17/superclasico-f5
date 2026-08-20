import { FORMATIONS, FORMATION_IDS } from "../lib/formations";
import type { FormationId } from "../types/match";

export function FormationSelector({ value, onChange, disabled = false }: { value: FormationId; onChange: (formation: FormationId) => void; disabled?: boolean }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-black uppercase tracking-wider">Formación</h3><span className="text-[10px] text-[#7585a0]">Reposiciona automáticamente</span></div>
      <div className="flex snap-x gap-2 overflow-x-auto pb-2">
        {FORMATION_IDS.map((id) => (
          <button key={id} disabled={disabled} onClick={() => onChange(id)} className={`min-h-14 min-w-[7.8rem] snap-start rounded-xl border px-3 text-left transition disabled:opacity-50 ${value === id ? "border-[#efb73e] bg-[#efb73e] text-[#111827]" : id === "all-up" ? "border-dashed border-fuchsia-400/20 bg-fuchsia-400/[0.04] text-fuchsia-100" : "border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"}`}>
            <strong className="block text-sm font-black italic">{FORMATIONS[id].label}</strong><span className={`text-[9px] font-semibold ${value === id ? "text-[#4a3a17]" : "text-[#71819b]"}`}>{FORMATIONS[id].description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
