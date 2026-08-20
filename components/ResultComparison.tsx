"use client";

import { useState } from "react";
import type { MatchResult, Prediction, RealResult } from "../types/match";
import type { Player } from "../types/player";

interface ResultComparisonProps {
  result: MatchResult;
  realResult: RealResult | null;
  predictions: Prediction[];
  players: Player[];
  onRealResult: (value: RealResult) => void;
  onPrediction: (value: Prediction) => void;
}

export function ResultComparison({ result, realResult, predictions, players, onRealResult, onPrediction }: ResultComparisonProps) {
  const [real, setReal] = useState<RealResult>(realResult ?? { cerroGoals: 0, olimpiaGoals: 0 });
  const [prediction, setPrediction] = useState<Prediction>({ id: "", predictor: "", cerroGoals: 0, olimpiaGoals: 0 });
  const realDifference = realResult ? Math.abs(result.cerroGoals - realResult.cerroGoals) + Math.abs(result.olimpiaGoals - realResult.olimpiaGoals) : 0;
  const sortedPredictions = realResult ? [...predictions].sort((a, b) => (Math.abs(a.cerroGoals - realResult.cerroGoals) + Math.abs(a.olimpiaGoals - realResult.olimpiaGoals)) - (Math.abs(b.cerroGoals - realResult.cerroGoals) + Math.abs(b.olimpiaGoals - realResult.olimpiaGoals))) : [];
  const submitPrediction = (event: React.FormEvent) => { event.preventDefault(); if (!prediction.predictor.trim()) return; onPrediction({ ...prediction, id: `prediction-${Date.now()}`, predictor: prediction.predictor.trim() }); setPrediction({ id: "", predictor: "", cerroGoals: 0, olimpiaGoals: 0 }); };
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-[1.75rem] border border-white/10 bg-[#0d192b] p-4 sm:p-5">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#efb73e]">Cuando termine la verdad</p><h2 className="text-xl font-black uppercase italic">Resultado real</h2>
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-3"><ScoreInput label="Cerro" value={real.cerroGoals} onChange={(value) => setReal({ ...real, cerroGoals: value })} /><span className="pb-3 font-black text-[#65758e]">–</span><ScoreInput label="Olimpia" value={real.olimpiaGoals} onChange={(value) => setReal({ ...real, olimpiaGoals: value })} /></div>
        <button onClick={() => onRealResult(real)} className="mt-3 min-h-11 w-full rounded-xl bg-white font-black uppercase italic text-[#111827]">Guardar resultado real</button>
        {realResult && <div className="mt-4 rounded-2xl bg-black/20 p-4 text-center"><p className="text-[9px] font-bold uppercase tracking-wider text-[#71819a]">Simulación / Realidad</p><p className="mt-2 text-2xl font-black italic">{result.cerroGoals}–{result.olimpiaGoals} <span className="mx-2 text-[#46536a]">/</span> {realResult.cerroGoals}–{realResult.olimpiaGoals}</p><p className="mt-2 text-xs text-[#9eabc0]">{realDifference === 0 ? "Milagro: la máquina acertó exactamente." : realDifference <= 2 ? "Bastante cerca. Nadie haga preguntas." : realDifference <= 4 ? "La simulación vio otro partido." : "La inteligencia fue artificial; el error, completamente natural."}</p></div>}
      </section>
      <section className="rounded-[1.75rem] border border-white/10 bg-[#0d192b] p-4 sm:p-5">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#efb73e]">Derecho a equivocarse</p><h2 className="text-xl font-black uppercase italic">Predicciones</h2>
        <form onSubmit={submitPrediction} className="mt-4 space-y-3"><input required value={prediction.predictor} onChange={(event) => setPrediction({ ...prediction, predictor: event.target.value })} placeholder="Tu nombre" className="control" /><div className="grid grid-cols-2 gap-2"><ScoreInput label="Goles Cerro" value={prediction.cerroGoals} onChange={(value) => setPrediction({ ...prediction, cerroGoals: value })} /><ScoreInput label="Goles Olimpia" value={prediction.olimpiaGoals} onChange={(value) => setPrediction({ ...prediction, olimpiaGoals: value })} /></div><select value={prediction.mvpPlayerId ?? ""} onChange={(event) => setPrediction({ ...prediction, mvpPlayerId: event.target.value || undefined })} className="control"><option value="">Figura (opcional)</option>{players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select><button className="min-h-11 w-full rounded-xl bg-[#efb73e] font-black uppercase italic text-[#111827]">Guardar pronóstico</button></form>
        {predictions.length > 0 && <div className="mt-4 space-y-2">{predictions.map((item) => <div key={item.id} className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2 text-sm"><strong>{item.predictor}</strong><span className="font-mono font-black">{item.cerroGoals}–{item.olimpiaGoals}</span></div>)}{realResult && sortedPredictions.length > 0 && <p className="rounded-xl bg-emerald-400/10 p-3 text-xs text-emerald-200">Mejor pronóstico: <strong>{sortedPredictions[0].predictor}</strong> · Más nefasto: <strong>{sortedPredictions[sortedPredictions.length - 1].predictor}</strong></p>}</div>}
      </section>
    </div>
  );
}

function ScoreInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label className="block"><span className="mb-1 block text-[9px] font-black uppercase tracking-wider text-[#71819a]">{label}</span><input type="number" min={0} max={30} value={value} onChange={(event) => onChange(Math.max(0, Number(event.target.value)))} className="control text-center text-xl font-black" /></label>; }
