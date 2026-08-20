"use client";

import { useState } from "react";

export function ShareButton({ title, text, url, label = "📤 Compartir", className = "" }: { title: string; text: string; url?: string; label?: string; className?: string }) {
  const [manual, setManual] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");
  const fullText = `${text}\n\n${shareUrl}`;
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title, text, url: shareUrl }); return; } catch (error) { if (error instanceof Error && error.name === "AbortError") return; }
    }
    setManual(true);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(fullText); setCopied(true); } catch { setManual(true); }
  };
  return (
    <div className={className}>
      <button onClick={share} className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.06] px-4 text-sm font-extrabold text-white transition hover:bg-white/10">{label}</button>
      {manual && <div className="mt-2 rounded-2xl border border-white/10 bg-[#0a1424] p-3"><label htmlFor="share-message" className="text-[10px] font-bold uppercase tracking-wider text-[#8d9bb0]">Copiá este mensaje</label><textarea id="share-message" readOnly value={fullText} onFocus={(event) => event.currentTarget.select()} className="mt-2 min-h-36 w-full resize-none rounded-xl border border-white/10 bg-black/20 p-3 text-xs leading-relaxed text-white outline-none" /><button onClick={copy} className="mt-2 min-h-10 w-full rounded-xl bg-white font-extrabold text-[#101828]">{copied ? "✓ Copiado" : "Copiar texto"}</button></div>}
    </div>
  );
}
