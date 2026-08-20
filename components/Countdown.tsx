"use client";

import { useEffect, useState } from "react";

export function Countdown({ date, time }: { date: string; time: string }) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const update = () => setRemaining(Math.max(0, new Date(`${date}T${time || "00:00"}:00`).getTime() - Date.now()));
    update();
    const interval = window.setInterval(update, 30_000);
    return () => window.clearInterval(interval);
  }, [date, time]);

  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining / 3_600_000) % 24);
  const minutes = Math.floor((remaining / 60_000) % 60);
  const values = remaining > 0 ? [[days, "días"], [hours, "horas"], [minutes, "min"]] : [[0, "días"], [0, "horas"], [0, "min"]];
  return (
    <div className="grid grid-cols-3 gap-2" aria-label="Cuenta regresiva">
      {values.map(([value, label]) => (
        <div key={label} className="rounded-2xl border border-white/10 bg-black/20 px-2 py-3 text-center">
          <strong className="block text-2xl font-black italic sm:text-3xl">{String(value).padStart(2, "0")}</strong>
          <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.17em] text-[#7889a4]">{label}</span>
        </div>
      ))}
    </div>
  );
}
