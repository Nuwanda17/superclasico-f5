import type { SocialSection } from "../lib/preferences";

const ITEMS: Array<{ id: SocialSection; label: string; icon: string }> = [
  { id: "home", label: "Inicio", icon: "⌂" }, { id: "players", label: "Jugadores", icon: "●" },
  { id: "scouting", label: "Scouting", icon: "◎" }, { id: "teams", label: "Equipos", icon: "⌁" }, { id: "match", label: "Partido", icon: "▶" },
];

export function SocialNavbar({ active, onChange }: { active: SocialSection; onChange: (section: SocialSection) => void }) {
  return <><nav aria-label="Navegación principal" className="hidden rounded-2xl border border-white/10 bg-[#0d1727]/90 p-1.5 lg:block"><ul className="flex gap-1">{ITEMS.map((item) => <li key={item.id}><button onClick={() => onChange(item.id)} aria-current={active === item.id ? "page" : undefined} className={`min-h-11 rounded-xl px-4 text-xs font-extrabold ${active === item.id ? "bg-white text-[#101522]" : "text-[#8190a7] hover:bg-white/5 hover:text-white"}`}>{item.label}</button></li>)}</ul></nav><nav aria-label="Navegación principal" className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#07101f]/95 px-1 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl lg:hidden"><ul className="mx-auto flex w-full max-w-lg">{ITEMS.map((item) => <li key={item.id} className="min-w-0 flex-1"><button onClick={() => onChange(item.id)} aria-current={active === item.id ? "page" : undefined} className={`w-full min-w-0 rounded-xl px-0 py-2 text-[8px] font-bold ${active === item.id ? "bg-white/10 text-white" : "text-[#75849c]"}`}><span className="mb-0.5 block text-base" aria-hidden="true">{item.icon}</span>{item.label}</button></li>)}</ul></nav></>;
}
