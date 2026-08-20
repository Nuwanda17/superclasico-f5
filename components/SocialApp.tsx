"use client";

import { useEffect, useState } from "react";
import { Awards } from "./Awards";
import { MatchScoreboard } from "./MatchScoreboard";
import { MatchStats } from "./MatchStats";
import { MatchTimeline } from "./MatchTimeline";
import { MyPlayerForm } from "./MyPlayerForm";
import { RatingForm } from "./RatingForm";
import { ScoutingPanel } from "./ScoutingPanel";
import { ShareButton } from "./ShareButton";
import { SocialHome } from "./SocialHome";
import { SocialNavbar } from "./SocialNavbar";
import { SocialRoster } from "./SocialRoster";
import { TeamBuilder } from "./TeamBuilder";
import { TeamLogo } from "./TeamLogo";
import { useMatchRoom } from "../hooks/useMatchRoom";
import { preferences, type SimulationSpeed, type SocialSection } from "../lib/preferences";
import { simulateMatch, validateLineups } from "../lib/simulationEngine";
import type { MatchResult } from "../types/match";
import type { Player } from "../types/player";

export function SocialApp({ slug = "superclasico-f5" }: { slug?: string }) {
  const [demo, setDemo] = useState(false);
  const room = useMatchRoom(slug, demo);
  const [section, setSection] = useState<SocialSection>("home");
  const [editingPlayer, setEditingPlayer] = useState(false);
  const [ratingPlayer, setRatingPlayer] = useState<Player | null>(null);
  const [viewTeam, setViewTeam] = useState<"cerro" | "olimpia">("cerro");
  const [speed, setSpeed] = useState<SimulationSpeed>("normal");
  const [simulationResult, setSimulationResult] = useState<MatchResult | null>(null);
  const [visibleEvents, setVisibleEvents] = useState(0);
  const [running, setRunning] = useState(false);
  const [preparingNewMatch, setPreparingNewMatch] = useState(false);

  useEffect(() => { const timer = window.setTimeout(() => { setSection(preferences.loadTab()); setSpeed(preferences.loadSpeed()); }, 0); return () => window.clearTimeout(timer); }, []);
  const navigate = (next: SocialSection) => { setSection(next); preferences.saveTab(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const changeSpeed = (next: SimulationSpeed) => { setSpeed(next); preferences.saveSpeed(next); };

  useEffect(() => {
    if (!running || !simulationResult) return;
    const delay = speed === "instant" ? 0 : speed === "fast" ? 240 : 900;
    const timer = window.setTimeout(() => {
      if (speed === "instant") { setVisibleEvents(simulationResult.events.length); setRunning(false); return; }
      if (visibleEvents >= simulationResult.events.length) { setRunning(false); return; }
      setVisibleEvents((value) => value + 1);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [running, simulationResult, speed, visibleEvents]);

  if (room.status === "loading") return <StateScreen icon="◌" title="Abriendo el vestuario…" description="Estamos cargando convocados, scouting y formaciones." />;
  if (room.status === "unconfigured") return <SetupRequired onDemo={() => setDemo(true)} />;
  if (room.status === "error" || !room.data || !room.userId) return <StateScreen icon="⚠" title="No pudimos cargar la previa" description={room.error ?? "La conexión hizo agua."} action="Reintentar" onAction={room.retry} />;
  const data = room.data;
  const myPlayer = data.players.find((player) => player.ownerUserId === room.userId);
  const lineupErrors = validateLineups(data.players);
  const shownResult = preparingNewMatch ? null : simulationResult ?? data.latestResult?.result ?? null;
  const shownEvents = simulationResult ? simulationResult.events.slice(0, visibleEvents) : shownResult?.events ?? [];
  const currentMinute = shownEvents[shownEvents.length - 1]?.minute ?? 0;
  const finished = Boolean(shownResult) && (!simulationResult || (!running && visibleEvents >= (simulationResult.events.length ?? 0)));

  const simulate = async () => {
    if (lineupErrors.length) return;
    const result = simulateMatch({ players: data.players, formations: data.formations });
    if (!(await room.publishResult(result))) return;
    setPreparingNewMatch(false); setSimulationResult(result); setVisibleEvents(0); setRunning(true); navigate("match");
  };
  const resultText = shownResult ? `🔥 FINAL DEL SUPERCLÁSICO F5\n\nCERRO ${shownResult.cerroGoals} - ${shownResult.olimpiaGoals} OLIMPIA\n\n🏆 Figura: ${data.players.find((player) => player.id === shownResult.mvpPlayerId)?.name ?? "por confirmar"}\n\n40 minutos de dudosa calidad futbolística.` : "";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#07101f] text-white">
      <div className="mx-auto min-h-screen max-w-6xl px-3 pb-28 pt-4 sm:px-6 lg:pb-12">
        <header className="mb-5 flex items-center justify-between gap-3"><button onClick={() => navigate("home")} className="text-left"><p className="text-[8px] font-black uppercase tracking-[0.28em] text-[#f2bd45]">Matchday social</p><p className="font-display text-2xl uppercase leading-none">Superclásico F5</p></button><SocialNavbar active={section} onChange={navigate} /><div className={`hidden items-center gap-1.5 rounded-full border px-3 py-2 text-[10px] font-bold sm:flex ${room.realtimeStatus === "connected" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-amber-300/20 bg-amber-300/10 text-amber-200"}`}><span className={`h-1.5 w-1.5 rounded-full ${room.realtimeStatus === "connected" ? "bg-emerald-300" : "bg-amber-200"}`} />{room.isDemo ? "Demo local" : room.realtimeStatus === "connected" ? "En vivo" : "Reconectando"}</div></header>
        {(room.status === "offline" || room.error) && <div role="status" className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] p-3 text-xs font-bold text-amber-100"><span>{room.status === "offline" ? "Estás sin conexión. Mostramos la última jugada cargada." : room.error}</span><button onClick={room.retry} className="min-h-9 rounded-lg bg-white/10 px-3">Reintentar</button></div>}
        {section === "home" && <SocialHome match={data.match} players={data.players} myPlayer={myPlayer} onJoin={() => setEditingPlayer(true)} onViewPlayers={() => navigate("players")} />}
        {section === "players" && <div><PageTitle eyebrow="La convocatoria" title="Jugadores" description="Elegí camiseta, mirá quién ya se anotó y seguí cómo avanza el scouting." />{!myPlayer && <button onClick={() => setEditingPlayer(true)} className="mb-4 min-h-14 w-full rounded-2xl bg-[#f2bd45] font-black uppercase text-[#101522]">⚽ Anotarme</button>}<SocialRoster players={data.players} userId={room.userId} onEditMine={() => setEditingPlayer(true)} /></div>}
        {section === "scouting" && <div><PageTitle eyebrow="La opinión de la calle" title="Scouting" description="Evaluaciones anónimas, cartas que se revelan y material garantizado para el grupo." /><ScoutingPanel players={data.players} userId={room.userId} myRatings={data.myRatings} onRate={setRatingPlayer} /></div>}
        {section === "teams" && <div><PageTitle eyebrow="La pizarra" title="Equipos" description="Cinco por lado, un arquero y una formación que por lo menos parezca pensada." /><TeamBuilder players={data.players} formations={data.formations} viewTeam={viewTeam} onViewTeam={setViewTeam} onFormationChange={room.changeFormation} onToggleStarter={room.toggleStarter} onGoalkeeper={room.chooseGoalkeeper} pendingKey={room.pendingKey} message={room.error ?? undefined} /><div className="mt-4"><Readiness errors={lineupErrors} /></div></div>}
        {section === "match" && <div><PageTitle eyebrow="La transmisión más dudosa" title="Partido" description="Los ratings de tus amigos inclinan la cancha. El caos conserva la última palabra." />{!shownResult ? <section className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-[#0d192b] p-5 text-center sm:p-8"><div className="mx-auto flex w-fit items-center gap-5"><TeamLogo team="cerro" size="lg" /><span className="font-display text-5xl text-[#526079]">VS</span><TeamLogo team="olimpia" size="lg" /></div><div className="mt-5 text-left"><Readiness errors={lineupErrors} /></div><SpeedControl value={speed} onChange={changeSpeed} /><button disabled={lineupErrors.length > 0 || room.pendingKey === "simulation"} onClick={simulate} className="mt-5 min-h-16 w-full rounded-2xl bg-[#f2bd45] text-lg font-black uppercase text-[#101522] disabled:opacity-40">{room.pendingKey === "simulation" ? "Publicando la simulación…" : "Simular Superclásico"}</button></section> : <div className="space-y-4"><MatchScoreboard events={shownEvents} minute={finished ? 40 : currentMinute} final={finished} />{simulationResult && !finished && <SpeedControl value={speed} onChange={changeSpeed} />}<section className="rounded-[1.7rem] border border-white/10 bg-[#0d192b] p-3 sm:p-5"><MatchTimeline events={shownEvents} /></section>{finished && <><MatchStats result={shownResult} players={data.players} /><Awards result={shownResult} players={data.players} /><ShareButton title="Resultado Superclásico F5" text={resultText} /><button disabled={Boolean(room.pendingKey)} onClick={() => { setPreparingNewMatch(true); setSimulationResult(null); setVisibleEvents(0); }} className="min-h-12 w-full rounded-2xl border border-white/10 text-sm font-black">Preparar otra simulación</button></>}</div>}</div>}
      </div>
      {editingPlayer && <MyPlayerForm initial={myPlayer} pending={room.pendingKey === "player-save"} onSave={(input) => myPlayer ? room.updateMyPlayer(myPlayer.id, input) : room.createMyPlayer(input)} onCancel={() => setEditingPlayer(false)} />}
      {ratingPlayer && <RatingForm player={ratingPlayer} initial={data.myRatings[ratingPlayer.id]} pending={room.pendingKey === `rating-${ratingPlayer.id}`} onSave={(input) => room.ratePlayer(ratingPlayer.id, input)} onCancel={() => setRatingPlayer(null)} />}
    </main>
  );
}

function PageTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div className="mb-5"><p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#f2bd45]">{eyebrow}</p><h1 className="font-display mt-1 text-5xl uppercase leading-none sm:text-6xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8c9bb2]">{description}</p></div>; }
function Readiness({ errors }: { errors: string[] }) { return errors.length === 0 ? <p className="rounded-xl bg-emerald-400/10 p-3 text-sm font-black text-emerald-300">🔥 Todo listo para el Superclásico.</p> : <div className="space-y-1.5">{errors.map((error) => <p key={error} className="rounded-xl bg-amber-300/[0.07] px-3 py-2 text-xs font-bold text-amber-100">• {error}</p>)}</div>; }
function SpeedControl({ value, onChange }: { value: SimulationSpeed; onChange: (value: SimulationSpeed) => void }) { return <div className="mt-5"><p className="mb-2 text-[9px] font-black uppercase tracking-wider text-[#71819a]">Velocidad del relato</p><div className="grid grid-cols-3 rounded-xl bg-black/20 p-1">{(["normal", "fast", "instant"] as const).map((item) => <button key={item} onClick={() => onChange(item)} className={`min-h-10 rounded-lg text-[10px] font-black uppercase ${value === item ? "bg-white text-[#111827]" : "text-[#7f8fa8]"}`}>{item === "normal" ? "Normal" : item === "fast" ? "Rápida" : "Instantánea"}</button>)}</div></div>; }
function StateScreen({ icon, title, description, action, onAction }: { icon: string; title: string; description: string; action?: string; onAction?: () => void }) { return <main className="grid min-h-screen place-items-center bg-[#07101f] p-5 text-center text-white"><div className="max-w-sm"><span className="text-4xl">{icon}</span><h1 className="font-display mt-3 text-4xl uppercase">{title}</h1><p className="mt-2 text-sm text-[#8594aa]">{description}</p>{action && <button onClick={onAction} className="mt-5 min-h-12 rounded-xl bg-white px-5 font-black text-[#111827]">{action}</button>}</div></main>; }
function SetupRequired({ onDemo }: { onDemo: () => void }) { return <main className="min-h-screen bg-[#07101f] p-4 text-white"><div className="mx-auto max-w-xl pt-12 text-center"><div className="mx-auto flex w-fit items-center gap-5"><TeamLogo team="cerro" size="lg" /><span className="font-display text-5xl text-[#56647a]">VS</span><TeamLogo team="olimpia" size="lg" /></div><p className="mt-6 text-[9px] font-black uppercase tracking-[0.28em] text-[#f2bd45]">Superclásico F5</p><h1 className="font-display mt-1 text-5xl uppercase leading-none">Falta conectar la cancha compartida</h1><p className="mt-4 text-sm leading-relaxed text-[#8d9bb0]">Configurá las dos variables de Supabase y ejecutá el SQL incluido. La app no cargará datos ficticios en producción.</p>{process.env.NODE_ENV === "development" && <button onClick={onDemo} className="mt-6 min-h-12 rounded-xl bg-[#f2bd45] px-5 font-black text-[#101522]">Cargar datos demo</button>}</div></main>; }
