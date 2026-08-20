import type { MatchConfig } from "../types/match";
import { Countdown } from "./Countdown";

interface MatchHeaderProps {
  config: MatchConfig;
  cerroCount: number;
  olimpiaCount: number;
  onConfigChange: (config: MatchConfig) => void;
  onBuildTeams: () => void;
}

export function MatchHeader({ config, cerroCount, olimpiaCount, onConfigChange, onBuildTeams }: MatchHeaderProps) {
  const set = (field: keyof MatchConfig, value: string) => onConfigChange({ ...config, [field]: value });
  return (
    <div className="space-y-4">
      <section className="stadium-glow relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d192b] px-4 py-7 shadow-2xl shadow-black/30 sm:px-10 sm:py-10">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-red-600/15 blur-3xl" />
        <p className="relative text-center text-[10px] font-black uppercase tracking-[0.35em] text-[#f2c15b] sm:text-xs">Noche de Superclásico</p>
        <h1 className="relative mt-3 text-center text-[2rem] font-black uppercase italic leading-[0.88] tracking-[-0.055em] sm:text-6xl">
          Cerro Porteño <span className="text-[#71829f]">vs</span> Olimpia
        </h1>

        <div className="relative mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-8">
          <TeamIdentity team="cerro" count={cerroCount} />
          <div className="text-center">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-2xl font-black italic sm:px-5 sm:text-4xl">VS</div>
            <p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-[#7585a0]">Fútbol 5</p>
          </div>
          <TeamIdentity team="olimpia" count={olimpiaCount} />
        </div>

        <div className="relative mt-8 grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 sm:grid-cols-3">
          <ConfigField label="Fecha" type="date" value={config.date} onChange={(value) => set("date", value)} />
          <ConfigField label="Hora" type="time" value={config.time} onChange={(value) => set("time", value)} />
          <ConfigField label="Lugar" value={config.place} onChange={(value) => set("place", value)} />
        </div>
        <p className="relative mx-auto mt-6 max-w-xl text-center text-sm font-semibold leading-relaxed text-[#aebbd0] sm:text-base">“90 años de rivalidad. 40 minutos de dudosa calidad futbolística.”</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-[1.3fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-[#0d192b] p-4 sm:p-5">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#7585a0]">Falta poquito (o demasiado)</p>
          <Countdown date={config.date} time={config.time} />
        </div>
        <button onClick={onBuildTeams} className="min-h-24 rounded-3xl bg-[#efb73e] px-6 text-left text-lg font-black uppercase italic text-[#121827] shadow-lg shadow-[#efb73e]/10 transition hover:-translate-y-0.5 hover:bg-[#ffd068]">Armar los equipos <span aria-hidden="true">→</span></button>
      </section>
    </div>
  );
}

function TeamIdentity({ team, count }: { team: "cerro" | "olimpia"; count: number }) {
  const isCerro = team === "cerro";
  return (
    <div className="text-center">
      <div className={`mx-auto grid aspect-square w-20 place-items-center rounded-[1.6rem] border-4 shadow-xl sm:w-28 ${isCerro ? "border-[#e93242] bg-[#1646a0] shadow-blue-950" : "border-white bg-[#141820] shadow-black"}`}>
        <span className="text-2xl font-black italic sm:text-4xl">{isCerro ? "CP" : "O"}</span>
      </div>
      <p className="mt-3 text-base font-black uppercase italic sm:text-xl">{isCerro ? "Cerro" : "Olimpia"}</p>
      <p className="mt-1 text-[10px] font-bold text-[#7f91ad]">{count} convocados</p>
    </div>
  );
}

function ConfigField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="rounded-xl bg-white/[0.04] px-3 py-2">
      <span className="block text-[9px] font-bold uppercase tracking-widest text-[#6f809c]">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 min-h-7 w-full min-w-0 bg-transparent text-sm font-black text-white outline-none [color-scheme:dark]" />
    </label>
  );
}
