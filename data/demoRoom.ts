import { DEMO_PLAYERS } from "./demoPlayers";
import { applyCommunityRatings, calculateOverall } from "../lib/ratings";
import type { PlayerRatingSummary, RoomData } from "../types/social";

export const DEMO_USER_ID = "demo-user";

export function createDemoRoomData(): RoomData {
  const players = DEMO_PLAYERS.map((player, index) => {
    const base = 5.4 + (index % 5) * 0.55;
    const summary: PlayerRatingSummary = {
      playerId: player.id,
      voteCount: index % 4 === 0 ? 2 : 3 + (index % 5),
      revealed: index % 4 !== 0,
      overall: null,
      topTrait: index % 2 === 0 ? "Patea aunque no corresponda" : "Juega como si fuera una final",
      technique: base + 0.5, finishing: base, passing: base + 0.3, defense: 6.8 - (index % 3) * 0.5,
      stamina: 6.2 + (index % 2), goalkeeping: player.goalkeeper ? 8.4 : 2.2, magic: base + 0.4,
      grit: 6.5 + (index % 3) * 0.4, hype: 7.8 - (index % 3) * 0.3, chaos: 4.5 + (index % 4),
    };
    summary.overall = summary.revealed ? calculateOverall(summary, player.goalkeeper) : null;
    return applyCommunityRatings({ ...player, matchId: "demo-match", ownerUserId: index === 0 ? DEMO_USER_ID : `demo-owner-${index}` }, summary);
  });
  return {
    match: { id: "demo-match", slug: "superclasico-f5", title: "SUPERCLÁSICO F5", homeTeam: "Cerro Porteño", awayTeam: "Olimpia", matchDate: new Date(Date.now() + 86_400_000).toISOString(), venue: "La canchita", createdAt: new Date().toISOString() },
    players,
    formations: { cerro: "1-2-1", olimpia: "2-1-1" },
    latestResult: null,
    myRatings: {},
  };
}
