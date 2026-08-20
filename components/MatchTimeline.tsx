import type { MatchEvent } from "../types/match";

const ICONS: Partial<Record<MatchEvent["type"], string>> = { goal: "⚽", golazo: "⚽", save: "🧤", card: "🟨", error: "⚠", blooper: "🤡", post: "🥅", fatigue: "🫁", skill: "🎩", recovery: "🔥", argument: "💬" };

export function MatchTimeline({ events, emptyText = "El árbitro mira el reloj. Todavía no pasó nada raro." }: { events: MatchEvent[]; emptyText?: string }) {
  return (
    <div className="space-y-2" aria-live="polite">
      {events.length === 0 && <p className="rounded-2xl border border-dashed border-white/10 p-7 text-center text-sm text-[#74849f]">{emptyText}</p>}
      {events.map((event) => {
        const isGoal = event.type === "goal" || event.type === "golazo";
        return (
          <article key={event.id} className={`timeline-event grid grid-cols-[2.5rem_1fr] gap-2 rounded-2xl border p-3 ${isGoal ? event.team === "cerro" ? "border-blue-400/30 bg-blue-500/10" : "border-white/20 bg-white/[0.07]" : "border-white/8 bg-white/[0.025]"}`}>
            <time className={`font-mono text-sm font-black ${isGoal ? "text-[#efc867]" : "text-[#6f809b]"}`}>{String(event.minute).padStart(2, "0")}&apos;</time>
            <div><p className={`text-sm leading-relaxed ${isGoal ? "font-black text-white" : "font-medium text-[#c2cada]"}`}><span className="mr-1.5" aria-hidden="true">{ICONS[event.type] ?? "•"}</span>{event.text}</p>{event.secondaryPlayer && isGoal && <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#7890b1]">Asistencia: {event.secondaryPlayer.name}</p>}</div>
          </article>
        );
      })}
    </div>
  );
}
