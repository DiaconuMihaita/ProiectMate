import type { Difficulty, LobbyState, MatchState } from "../../../shared/dist/index.js";
import { toPlayerPublic } from "./playerPublic.js";

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

