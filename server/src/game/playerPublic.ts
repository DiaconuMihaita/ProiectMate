import type { PlayerPublic } from "../../../shared/dist/index.js";
import type { ConnectedPlayer } from "./types.js";

export function toPlayerPublic(player: ConnectedPlayer): PlayerPublic {
  const colors = ["#22d3ee", "#f59e0b", "#ef4444", "#a3e635"];
  const lastChar = player.userId.charAt(player.userId.length - 1) || "0";
  const idx = Number(lastChar) % colors.length;

  return {
    userId: player.userId,
    username: player.username,
    color: colors[idx]!,
    score: 0,
    xp: player.xp,
    rating: player.rating,
    wins: player.wins,
    losses: player.losses,
    accuracy: player.accuracy
  };
}
