export type SectionId = "home" | "players" | "teams" | "simulation" | "result";

const ITEMS: Array<{ id: SectionId; label: string; icon: string }> = [
  { id: "home", label: "Previa", icon: "⌂" },
  { id: "players", label: "Jugadores", icon: "●" },
  { id: "teams", label: "Equipos", icon: "⌁" },
  { id: "simulation", label: "Simular", icon: "▶" },
  { id: "result", label: "Resultado", icon: "★" },
];

interface NavbarProps { active: SectionId; onChange: (section: SectionId) => void }

export function Navbar({ active, onChange }: NavbarProps) {
  return (
    <>
      <nav aria-label="Navegación principal" className="hidden rounded-2xl border border-white/10 bg-[#101b2d]/90 p-1.5 lg:block">
        <ul className="flex items-center gap-1">
          {ITEMS.map((item) => (
            <li key={item.id}>
              <button onClick={() => onChange(item.id)} className={`min-h-11 rounded-xl px-4 text-sm font-extrabold transition ${active === item.id ? "bg-white text-[#091321]" : "text-[#8290a8] hover:bg-white/5 hover:text-white"}`}>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label="Navegación principal" className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#091321]/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
        <ul className="mx-auto flex max-w-lg items-center justify-around">
          {ITEMS.map((item) => (
            <li key={item.id}>
              <button onClick={() => onChange(item.id)} aria-current={active === item.id ? "page" : undefined} className={`min-w-14 rounded-xl px-2 py-2 text-[10px] font-bold transition ${active === item.id ? "bg-white/10 text-white" : "text-[#7585a0]"}`}>
                <span className="mb-1 block text-base" aria-hidden="true">{item.icon}</span>{item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
