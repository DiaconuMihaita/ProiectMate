import type { Difficulty, LobbyState, MatchState, PlayerPublic } from "@mathquiztador/shared";

export interface ConnectedPlayer {
  userId: string;
  username: string;
  socketId: string;
  rating: number;
  xp: number;
  wins: number;
  losses: number;
  accuracy: number;
}

export interface LobbyInternal {
  roomCode: string;
  hostUserId: string;
  mode: 2 | 3 | 4;
  difficulty: Difficulty;
  players: ConnectedPlayer[];
  started: boolean;
}

export interface MatchInternal extends MatchState {
  answers: Record<string, { answer: string; at: number }>;
  duelAnswers: Record<string, { answer: string; at: number }>;
  pendingAttacks: Array<{
    userId: string;
    fromTerritoryId: string;
    toTerritoryId: string;
    at: number;
  }>;
}

export function toLobbyPublic(lobby: LobbyInternal): LobbyState {
  return {
    roomCode: lobby.roomCode,
    hostUserId: lobby.hostUserId,
    mode: lobby.mode,
    difficulty: lobby.difficulty,
    players: lobby.players.map(toPlayerPublic),
    started: lobby.started
  };
}

export function toPlayerPublic(player: ConnectedPlayer): PlayerPublic {
  const colors = ["#22d3ee", "#f59e0b", "#ef4444", "#a3e635"];
  const idx = Number(player.userId.at(-1) ?? "0") % colors.length;

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
