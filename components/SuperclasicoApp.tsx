"use client";

import { useEffect, useMemo, useState } from "react";
import { Awards } from "./Awards";
import { MatchHeader } from "./MatchHeader";
import { MatchScoreboard } from "./MatchScoreboard";
import { MatchStats } from "./MatchStats";
import { MatchTimeline } from "./MatchTimeline";
import { Navbar, type SectionId } from "./Navbar";
import { PlayerForm } from "./PlayerForm";
import { ResultComparison } from "./ResultComparison";
import { TeamBuilder } from "./TeamBuilder";
import { TeamRoster } from "./TeamRoster";
import { DEMO_PLAYERS } from "../data/demoPlayers";
import { simulateMatch, validateLineups } from "../lib/simulationEngine";
import { EMPTY_APP_DATA, storage, type AppData } from "../lib/storage";
import type { FormationId, MatchConfig, Prediction, RealResult } from "../types/match";
import type { Player, Team } from "../types/player";

type Speed = "normal" | "fast" | "instant";

export function SuperclasicoApp() {
  const [data, setData] = useState<AppData>(EMPTY_APP_DATA);
  const [loaded, setLoaded] = useState(false);
  const [section, setSection] = useState<SectionId>("home");
  const [editingPlayer, setEditingPlayer] = useState<Player | "new" | null>(null);
  const [viewTeam, setViewTeam] = useState<"cerro" | "olimpia">("cerro");
  const [teamMessage, setTeamMessage] = useState("");
  const [speed, setSpeed] = useState<Speed>("normal");
  const [visibleEvents, setVisibleEvents] = useState(0);
  const [running, setRunning] = useState(false);
  const [simulationMessage, setSimulationMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => { setData(storage.load()); setLoaded(true); }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (loaded) storage.save(data); }, [data, loaded]);

  const lineupErrors = useMemo(() => validateLineups(data.players), [data.players]);
  const currentEvents = data.lastMatch?.events.slice(0, visibleEvents) ?? [];
  const currentMinute = currentEvents[currentEvents.length - 1]?.minute ?? 0;

  useEffect(() => {
    if (!running || !data.lastMatch) return;
    const timer = window.setTimeout(() => {
      if (!data.lastMatch) return;
      if (speed === "instant") { setVisibleEvents(data.lastMatch.events.length); setRunning(false); return; }
      if (visibleEvents >= data.lastMatch.events.length) { setRunning(false); return; }
      setVisibleEvents((count) => count + 1);
    }, speed === "fast" ? 260 : speed === "instant" ? 0 : 950);
    return () => window.clearTimeout(timer);
  }, [running, speed, visibleEvents, data.lastMatch]);

  const updateData = (partial: Partial<AppData>) => setData((current) => ({ ...current, ...partial }));
  const updatePlayers = (players: Player[]) => updateData({ players });
  const navigate = (next: SectionId) => { setSection(next); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const savePlayer = (player: Player) => {
    const exists = data.players.some((item) => item.id === player.id);
    updatePlayers(exists ? data.players.map((item) => item.id === player.id ? player : item) : [...data.players, player]);
    setEditingPlayer(null);
  };
  const deletePlayer = (player: Player) => {
    if (window.confirm(`¿Eliminar a ${player.name}? Esta jugada no tiene VAR.`)) updatePlayers(data.players.filter((item) => item.id !== player.id));
  };
  const changeTeam = (player: Player, team: Team) => updatePlayers(data.players.map((item) => item.id === player.id ? { ...item, team, starter: team === "undecided" ? false : item.starter, goalkeeper: team === "undecided" ? false : item.goalkeeper } : item));
  const toggleStarter = (player: Player) => {
    const count = data.players.filter((item) => item.team === player.team && item.starter).length;
    if (!player.starter && count >= 5) { setTeamMessage(`${player.team === "cerro" ? "Cerro" : "Olimpia"} ya tiene cinco titulares. Mandá uno al banco primero.`); return; }
    updatePlayers(data.players.map((item) => item.id === player.id ? { ...item, starter: !item.starter, goalkeeper: item.starter ? false : item.goalkeeper } : item));
    setTeamMessage("");
  };
  const chooseGoalkeeper = (player: Player) => {
    updatePlayers(data.players.map((item) => item.team === player.team ? { ...item, goalkeeper: item.id === player.id ? !player.goalkeeper : false } : item));
    setTeamMessage(player.starter ? "" : `${player.name} quedó marcado para el arco. Falta ponerlo de titular.`);
  };
  const changeFormation = (team: "cerro" | "olimpia", formation: FormationId) => updateData({ formations: { ...data.formations, [team]: formation } });

  const runSimulation = () => {
    const errors = validateLineups(data.players);
    if (errors.length) { setSimulationMessage(errors.join(" ")); return; }
    try {
      const result = simulateMatch({ players: data.players, formations: data.formations });
      updateData({ lastMatch: result });
      setVisibleEvents(0);
      setRunning(true);
      setSimulationMessage("");
      navigate("simulation");
    } catch (error) {
      setSimulationMessage(error instanceof Error ? error.message : "No se pudo simular el partido.");
    }
  };
  const loadDemo = () => { updatePlayers(DEMO_PLAYERS.map((player) => ({ ...player }))); setTeamMessage(""); };
  const resetAll = () => {
    if (!window.confirm("¿Borrar jugadores, formaciones y resultados? No hay vuelta atrás ni repechaje.")) return;
    storage.clear(); setData(EMPTY_APP_DATA); setVisibleEvents(0); navigate("home");
  };

  if (!loaded) return <main className="grid min-h-screen place-items-center bg-[#07101f] text-sm font-bold text-[#8290a8]">Encendiendo las luces de la cancha…</main>;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#07101f] text-white">
      <div className="mx-auto min-h-screen max-w-6xl px-3 pb-28 pt-4 sm:px-6 lg:pb-12 lg:pt-5">
        <header className="mb-6 flex items-center justify-between gap-4">
          <button onClick={() => navigate("home")} className="text-left"><p className="text-[9px] font-black uppercase tracking-[0.27em] text-[#7f91ad]">La previa oficial</p><p className="mt-0.5 text-xl font-black italic tracking-tight">SUPERCLÁSICO F5</p></button>
          <Navbar active={section} onChange={navigate} />
          <button onClick={resetAll} className="hidden min-h-11 rounded-xl border border-white/10 px-3 text-xs font-bold text-[#8492a9] hover:bg-white/5 sm:block">Reiniciar todo</button>
        </header>

        {section === "home" && <MatchHeader config={data.config} cerroCount={data.players.filter((player) => player.team === "cerro").length} olimpiaCount={data.players.filter((player) => player.team === "olimpia").length} onConfigChange={(config: MatchConfig) => updateData({ config })} onBuildTeams={() => navigate(data.players.length ? "teams" : "players")} />}

        {section === "players" && (
          <div>
            <PageTitle eyebrow="La convocatoria" title="Jugadores" description="Creá las fichas, repartí los colores y discutí atributos sin arruinar la amistad." />
            <div className="mb-4 grid gap-2 sm:flex">
              <button onClick={() => setEditingPlayer("new")} className="min-h-12 rounded-2xl bg-[#efb73e] px-5 font-black uppercase italic text-[#111827]">+ Agregar jugador</button>
              <button onClick={loadDemo} className="min-h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-5 font-black text-white">Cargar jugadores de prueba</button>
            </div>
            {data.players.length === 0 ? <EmptyPlayers onLoad={loadDemo} onAdd={() => setEditingPlayer("new")} /> : <TeamRoster players={data.players} onEdit={setEditingPlayer} onDelete={deletePlayer} onTeamChange={changeTeam} />}
          </div>
        )}

        {section === "teams" && (
          <div>
            <PageTitle eyebrow="La pizarra" title="Armar equipos" description="Cinco titulares por lado, un arquero y una formación que parezca intencional." />
            <TeamBuilder players={data.players} formations={data.formations} viewTeam={viewTeam} onViewTeam={setViewTeam} onFormationChange={changeFormation} onToggleStarter={toggleStarter} onGoalkeeper={chooseGoalkeeper} message={teamMessage} />
            <div className="mt-4 rounded-[1.75rem] border border-white/10 bg-[#0d192b] p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
              <Readiness errors={lineupErrors} />
              <button onClick={() => navigate("simulation")} className="mt-3 min-h-12 w-full rounded-2xl bg-white px-5 font-black uppercase italic text-[#111827] sm:mt-0 sm:w-auto">Ir al simulador →</button>
            </div>
          </div>
        )}

        {section === "simulation" && (
          <div>
            <PageTitle eyebrow="Que decida la máquina" title="Simulador" description="Los atributos inclinan la cancha. El caos se reserva el derecho a ignorarlos." />
            {!data.lastMatch || (!running && visibleEvents === 0) ? (
              <section className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-[#0d192b] p-5 text-center sm:p-8">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.5rem] bg-[#efb73e]/10 text-3xl">⚽</div>
                <h2 className="mt-4 text-2xl font-black uppercase italic">Todo se define en 40 minutos</h2>
                <div className="mt-4 text-left"><Readiness errors={lineupErrors} /></div>
                <div className="mt-5"><SpeedControl value={speed} onChange={setSpeed} /></div>
                {simulationMessage && <p role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm font-bold text-red-200">{simulationMessage}</p>}
                <button onClick={runSimulation} disabled={lineupErrors.length > 0} className="mt-5 min-h-16 w-full rounded-2xl bg-[#efb73e] px-5 text-lg font-black uppercase italic text-[#111827] shadow-xl shadow-[#efb73e]/10 disabled:cursor-not-allowed disabled:opacity-40">Simular Superclásico</button>
              </section>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
                  <MatchScoreboard events={currentEvents} minute={currentMinute} final={!running && visibleEvents >= (data.lastMatch?.events.length ?? 0)} />
                  <div className="rounded-2xl border border-white/10 bg-[#0d192b] p-4"><SpeedControl value={speed} onChange={setSpeed} />{!running && visibleEvents >= (data.lastMatch?.events.length ?? 0) && <div className="mt-4 grid gap-2"><button onClick={() => navigate("result")} className="min-h-12 rounded-xl bg-[#efb73e] font-black uppercase italic text-[#111827]">Ver resultado final</button><button onClick={runSimulation} className="min-h-11 rounded-xl border border-white/10 font-bold text-[#9ba8bc]">Volver a simular</button></div>}</div>
                </div>
                <section className="rounded-[1.75rem] border border-white/10 bg-[#0d192b] p-3 sm:p-5"><MatchTimeline events={currentEvents} /></section>
              </div>
            )}
          </div>
        )}

        {section === "result" && (
          <div>
            {!data.lastMatch ? <section className="mx-auto max-w-2xl rounded-[2rem] border border-dashed border-white/10 p-8 text-center"><p className="text-4xl">📋</p><h1 className="mt-3 text-2xl font-black uppercase italic">Todavía no hay resultado</h1><p className="mt-2 text-sm text-[#8290a8]">Primero hay que simular el partido. Incluso este torneo respeta cierto orden.</p><button onClick={() => navigate("simulation")} className="mt-5 min-h-12 rounded-xl bg-[#efb73e] px-5 font-black uppercase italic text-[#111827]">Ir al simulador</button></section> : <ResultView data={data} onRealResult={(realResult) => updateData({ realResult })} onPrediction={(prediction) => updateData({ predictions: [...data.predictions, prediction] })} onSimulate={runSimulation} />}
          </div>
        )}
      </div>
      <Navbar active={section} onChange={navigate} />
      {editingPlayer && <PlayerForm initial={editingPlayer === "new" ? undefined : editingPlayer} onSave={savePlayer} onCancel={() => setEditingPlayer(null)} />}
    </main>
  );
}

function ResultView({ data, onRealResult, onPrediction, onSimulate }: { data: AppData; onRealResult: (value: RealResult) => void; onPrediction: (value: Prediction) => void; onSimulate: () => void }) {
  const result = data.lastMatch!;
  return <div className="space-y-5"><div className="text-center"><p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#efb73e]">Final del partido</p><h1 className="mt-2 text-3xl font-black uppercase italic sm:text-5xl">La historia ya está escrita*</h1><p className="mt-1 text-xs text-[#71819a]">*hasta que alguien toque “volver a simular”</p></div><MatchScoreboard events={result.events} minute={40} final /><MatchStats result={result} players={data.players} /><Awards result={result} players={data.players} /><section className="rounded-[1.75rem] border border-white/10 bg-[#0d192b] p-3 sm:p-5"><div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-black uppercase italic">Relato completo</h2><span className="text-xs font-bold text-[#71819a]">{result.events.length} eventos</span></div><div className="max-h-[32rem] overflow-y-auto pr-1"><MatchTimeline events={result.events} /></div></section><ResultComparison result={result} realResult={data.realResult} predictions={data.predictions} players={data.players} onRealResult={onRealResult} onPrediction={onPrediction} /><button onClick={onSimulate} className="min-h-14 w-full rounded-2xl border border-[#efb73e]/40 bg-[#efb73e]/10 font-black uppercase italic text-[#efc867] hover:bg-[#efb73e]/20">Volver a simular</button></div>;
}

function PageTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div className="mb-5"><p className="text-[9px] font-black uppercase tracking-[0.26em] text-[#efb73e]">{eyebrow}</p><h1 className="mt-1 text-3xl font-black uppercase italic tracking-tight sm:text-5xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#91a0b7]">{description}</p></div>; }

function EmptyPlayers({ onLoad, onAdd }: { onLoad: () => void; onAdd: () => void }) { return <section className="rounded-[2rem] border border-dashed border-white/10 bg-[#0d192b] p-7 text-center sm:p-10"><div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white/5 text-3xl">👟</div><h2 className="mt-4 text-xl font-black uppercase italic">El vestuario está vacío</h2><p className="mx-auto mt-2 max-w-md text-sm text-[#8290a8]">Cargá doce amigos ficticios para probar todo ahora mismo, o empezá la convocatoria real.</p><div className="mx-auto mt-5 grid max-w-sm gap-2 sm:grid-cols-2"><button onClick={onLoad} className="min-h-12 rounded-xl bg-[#efb73e] px-4 font-black text-[#111827]">Cargar demo</button><button onClick={onAdd} className="min-h-12 rounded-xl border border-white/10 px-4 font-black">Agregar uno</button></div></section>; }

function Readiness({ errors }: { errors: string[] }) { return errors.length === 0 ? <p className="rounded-xl bg-emerald-400/10 p-3 text-sm font-black text-emerald-300">🔥 Todo listo para el Superclásico.</p> : <div className="space-y-1.5">{errors.map((error) => <p key={error} className="rounded-xl bg-amber-300/[0.07] px-3 py-2 text-xs font-bold text-amber-100">• {error}</p>)}</div>; }

function SpeedControl({ value, onChange }: { value: Speed; onChange: (value: Speed) => void }) { return <div><p className="mb-2 text-[9px] font-black uppercase tracking-wider text-[#71819a]">Velocidad del relato</p><div className="grid grid-cols-3 rounded-xl bg-black/20 p-1">{(["normal", "fast", "instant"] as const).map((item) => <button key={item} onClick={() => onChange(item)} className={`min-h-10 rounded-lg text-[10px] font-black uppercase transition ${value === item ? "bg-white text-[#111827]" : "text-[#7f8fa8]"}`}>{item === "normal" ? "Normal" : item === "fast" ? "Rápida" : "Instantánea"}</button>)}</div></div>; }
