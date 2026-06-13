import type {
  AttackPhase,
  ClientToServerEvents,
  MatchState,
  ServerToClientEvents
} from "../../../shared/dist/index.js";
import { randomUUID } from "node:crypto";
import { createGameMap } from "./mapFactory.js";
import type { ConnectedPlayer, LobbyInternal, MatchInternal } from "./types.js";
import { toLobbyPublic } from "./types.js";
import { toPlayerPublic } from "./playerPublic.js";
import { generateQuestion, isCorrectAnswer } from "../services/questionGenerator.js";
import type { Server } from "socket.io";

const DUEL_WINDOW_MS = 8000;

function createRoomCode() {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

export class GameEngine {
  private lobbies = new Map<string, LobbyInternal>();
  private matches = new Map<string, MatchInternal>();

  constructor(
    private io: Server<ClientToServerEvents, ServerToClientEvents>,
    private onMatchCompleted?: (payload: { winnerUserId: string; participants: string[] }) => Promise<void>
  ) {}

  findRoomByUser(userId: string) {
    for (const [roomCode, lobby] of this.lobbies) {
      if (lobby.players.some((p) => p.userId === userId)) {
        return roomCode;
      }
    }
    return undefined;
  }

  createLobby(host: ConnectedPlayer, mode: 2 | 3, difficulty: "easy" | "medium" | "hard") {
    const roomCode = createRoomCode();

    const lobby: LobbyInternal = {
      roomCode,
      hostUserId: host.userId,
      mode,
      difficulty,
      started: false,
      players: [host]
    };

    this.lobbies.set(roomCode, lobby);
    this.io.to(host.socketId).socketsJoin(roomCode);
    this.emitLobby(roomCode);
  }

  joinLobby(player: ConnectedPlayer, roomCode: string) {
    const lobby = this.lobbies.get(roomCode);
    if (!lobby) {
      this.io.to(player.socketId).emit("lobby:error", { message: "Lobby inexistent." });
      return;
    }

    if (lobby.players.length >= lobby.mode) {
      this.io.to(player.socketId).emit("lobby:error", { message: "Lobby plin." });
      return;
    }

    if (lobby.players.some((p) => p.userId === player.userId)) {
      return;
    }

    lobby.players.push(player);
    this.io.to(player.socketId).socketsJoin(roomCode);
    this.emitLobby(roomCode);
  }

  startMatch(userId: string, roomCode: string) {
    const lobby = this.lobbies.get(roomCode);
    if (!lobby) return;
    if (lobby.hostUserId !== userId) return;
    if (lobby.players.length < lobby.mode) return;

    lobby.started = true;

    const players = lobby.players.map(toPlayerPublic);
    const match: MatchInternal = {
      roomCode,
      mode: lobby.mode,
      turnOrder: players.map((p) => p.userId),
      turnIndex: 0,
      map: createGameMap(players),
      players,
      streaks: {},
      chat: [],
      answers: {},
      duelAnswers: {},
      pendingAttacks: []
    };

    this.matches.set(roomCode, match);
    this.emitMatch(roomCode);
  }

  sendChat(roomCode: string, payload: { userId: string; username: string; message: string }) {
    const match = this.matches.get(roomCode);
    if (!match) return;

    match.chat.push({ ...payload, ts: Date.now() });
    this.io.to(roomCode).emit("chat:update", match.chat);
  }

  attack(userId: string, roomCode: string, fromTerritoryId: string, toTerritoryId: string) {
    const match = this.matches.get(roomCode);
    if (!match || match.winnerUserId) return;

    const from = match.map.territories.find((t) => t.id === fromTerritoryId);
    const to = match.map.territories.find((t) => t.id === toTerritoryId);
    if (!from || !to) return;
    if (from.ownerUserId !== userId) return;
    if (!from.neighbors.includes(to.id)) return;
    if (to.ownerUserId === userId) return;

    const now = Date.now();
    match.pendingAttacks = match.pendingAttacks.filter((a) => now - a.at < DUEL_WINDOW_MS);

    const existing = match.pendingAttacks.find(
      (a) => a.toTerritoryId === toTerritoryId && a.userId !== userId
    );

    if (existing && match.mode >= 3) {
      match.duelPhase = {
        duelId: randomUUID(),
        territoryId: toTerritoryId,
        challengers: [existing.userId, userId],
        question: generateQuestion("hard", true),
        startedAt: now,
        deadlineAt: now + 25000
      };

      match.attackPhase = undefined;
      match.answers = {};
      match.duelAnswers = {};
      match.pendingAttacks = match.pendingAttacks.filter((a) => a.toTerritoryId !== toTerritoryId);
      this.io.to(roomCode).emit("match:phase", { duelPhase: match.duelPhase });

      setTimeout(() => this.resolveDuel(roomCode), 25000);
      return;
    }

    const attackPhase: AttackPhase = {
      id: randomUUID(),
      attackerUserId: userId,
      defenderUserId: to.ownerUserId,
      fromTerritoryId,
      toTerritoryId,
      question: generateQuestion(match.mode === 2 ? "medium" : "hard"),
      status: "question",
      startedAt: now,
      deadlineAt: now + 20000
    };

    match.attackPhase = attackPhase;
    match.answers = {};
    match.pendingAttacks.push({ userId, fromTerritoryId, toTerritoryId, at: now });

    this.io.to(roomCode).emit("match:phase", { attackPhase });

    setTimeout(() => {
      this.resolveAttack(roomCode, attackPhase.id);
    }, 20000);
  }

  answer(userId: string, roomCode: string, phaseId: string, answer: string) {
    const match = this.matches.get(roomCode);
    if (!match || !match.attackPhase || match.attackPhase.id !== phaseId) return;

    const { attackerUserId, defenderUserId } = match.attackPhase;
    if (![attackerUserId, defenderUserId].includes(userId)) return;

    match.answers[userId] = { answer, at: Date.now() };

    if (match.answers[attackerUserId] && match.answers[defenderUserId]) {
      this.resolveAttack(roomCode, phaseId);
    }
  }

  duelAnswer(userId: string, roomCode: string, duelId: string, answer: string) {
    const match = this.matches.get(roomCode);
    if (!match || !match.duelPhase || match.duelPhase.duelId !== duelId) return;
    if (!match.duelPhase.challengers.includes(userId)) return;

    match.duelAnswers[userId] = { answer, at: Date.now() };

    const correct = isCorrectAnswer(match.duelPhase.question, answer);
    if (correct) {
      this.resolveDuel(roomCode, userId);
    }
  }

  private resolveAttack(roomCode: string, phaseId: string) {
    const match = this.matches.get(roomCode);
    if (!match || !match.attackPhase || match.attackPhase.id !== phaseId) return;

    const phase = match.attackPhase;
    const attackerAnswer = match.answers[phase.attackerUserId];
    const defenderAnswer = match.answers[phase.defenderUserId];

    const attackerCorrect = attackerAnswer
      ? isCorrectAnswer(phase.question, attackerAnswer.answer)
      : false;
    const defenderCorrect = defenderAnswer
      ? isCorrectAnswer(phase.question, defenderAnswer.answer)
      : false;

    let winnerUserId = phase.defenderUserId;

    if (attackerCorrect && defenderCorrect) {
      winnerUserId =
        attackerAnswer!.at <= defenderAnswer!.at ? phase.attackerUserId : phase.defenderUserId;
    } else if (attackerCorrect) {
      winnerUserId = phase.attackerUserId;
    }

    const fastestBonus = attackerCorrect && (!defenderCorrect || attackerAnswer!.at <= defenderAnswer!.at);
    const scoreBase = winnerUserId === phase.attackerUserId ? 100 : 75;

    this.rewardWinner(match, winnerUserId, scoreBase + (fastestBonus ? 50 : 0));

    if (winnerUserId === phase.attackerUserId) {
      const territory = match.map.territories.find((t) => t.id === phase.toTerritoryId);
      if (territory) territory.ownerUserId = winnerUserId;
    }

    match.attackPhase = undefined;
    match.answers = {};
    this.advanceTurn(match);
    this.checkVictory(match);
    this.emitMatch(roomCode);
  }

  private resolveDuel(roomCode: string, forcedWinner?: string) {
    const match = this.matches.get(roomCode);
    if (!match || !match.duelPhase) return;

    const duel = match.duelPhase;
    let winnerUserId = forcedWinner;

    if (!winnerUserId) {
      const valid = duel.challengers
        .map((userId) => ({ userId, entry: match.duelAnswers[userId] }))
        .filter((x) => x.entry && isCorrectAnswer(duel.question, x.entry.answer))
        .sort((a, b) => a.entry!.at - b.entry!.at);

      winnerUserId = valid[0]?.userId ?? duel.challengers[0];
    }

    const territory = match.map.territories.find((t) => t.id === duel.territoryId);
    if (territory) {
      territory.ownerUserId = winnerUserId;
      this.rewardWinner(match, winnerUserId, 150);
    }

    match.duelPhase = undefined;
    match.duelAnswers = {};
    this.advanceTurn(match);
    this.checkVictory(match);
    this.emitMatch(roomCode);
  }

  private rewardWinner(match: MatchInternal, userId: string, base: number) {
    const player = match.players.find((p) => p.userId === userId);
    if (!player) return;

    const streak = (match.streaks[userId] ?? 0) + 1;
    match.streaks[userId] = streak;

    for (const key of Object.keys(match.streaks)) {
      if (key !== userId) match.streaks[key] = 0;
    }

    const multiplier = 1 + Math.min(0.5, streak * 0.1);
    const points = Math.round(base * multiplier);
    player.score += points;
    player.xp += Math.round(points / 4);
  }

  private advanceTurn(match: MatchInternal) {
    match.turnIndex = (match.turnIndex + 1) % match.turnOrder.length;
  }

  private checkVictory(match: MatchInternal) {
    const owners = new Set(match.map.territories.map((t) => t.ownerUserId));
    if (owners.size === 1) {
      match.winnerUserId = [...owners][0];
      this.io.to(match.roomCode).emit("match:result", {
        winnerUserId: match.winnerUserId!,
        roomCode: match.roomCode
      });

      if (this.onMatchCompleted) {
        void this.onMatchCompleted({
          winnerUserId: match.winnerUserId!,
          participants: match.players.map((p) => p.userId)
        });
      }
    }
  }

  private emitLobby(roomCode: string) {
    const lobby = this.lobbies.get(roomCode);
    if (!lobby) return;
    this.io.to(roomCode).emit("lobby:update", toLobbyPublic(lobby));
  }

  private emitMatch(roomCode: string) {
    const match = this.matches.get(roomCode);
    if (!match) return;

    const publicState: MatchState = {
      roomCode: match.roomCode,
      mode: match.mode,
      turnOrder: match.turnOrder,
      turnIndex: match.turnIndex,
      map: match.map,
      players: match.players,
      streaks: match.streaks,
      attackPhase: match.attackPhase,
      duelPhase: match.duelPhase,
      chat: match.chat,
      winnerUserId: match.winnerUserId
    };

    this.io.to(roomCode).emit("match:update", publicState);
  }
}
