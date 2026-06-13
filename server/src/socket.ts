import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@mathquiztador/shared";
import { verifyToken } from "./auth.js";
import { UserModel } from "./models/User.js";
import { GameEngine } from "./game/gameEngine.js";
import { calculateElo } from "./services/elo.js";

export function setupSockets(io: Server<ClientToServerEvents, ServerToClientEvents>) {
  const gameEngine = new GameEngine(io, async ({ winnerUserId, participants }) => {
    const users = await UserModel.find({ _id: { $in: participants } });
    const winner = users.find((u) => u._id.toString() === winnerUserId);
    if (!winner) return;

    for (const user of users) {
      user.totalAnswers += 1;
      if (user._id.toString() === winnerUserId) {
        user.wins += 1;
        user.xp += 60;
      } else {
        user.losses += 1;
      }
    }

    if (users.length >= 2) {
      const loser = users.find((u) => u._id.toString() !== winnerUserId);
      if (loser) {
        const elo = calculateElo(winner.rating, loser.rating);
        winner.rating = elo.winner;
        loser.rating = elo.loser;
      }
    }

    await Promise.all(users.map((u) => u.save()));
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Unauthorized"));

    try {
      const decoded = verifyToken(token);
      socket.data.user = decoded;
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const authUser = socket.data.user as { sub: string; username: string };
    const user = await UserModel.findById(authUser.sub);
    if (!user) {
      socket.disconnect();
      return;
    }

    const connected = {
      userId: user._id.toString(),
      username: user.username,
      socketId: socket.id,
      rating: user.rating,
      xp: user.xp,
      wins: user.wins,
      losses: user.losses,
      accuracy: user.totalAnswers > 0 ? Math.round((user.correctAnswers / user.totalAnswers) * 100) : 0
    };

    socket.on("lobby:create", ({ mode, difficulty }) => {
      gameEngine.createLobby(connected, mode, difficulty);
    });

    socket.on("lobby:join", ({ roomCode }) => {
      gameEngine.joinLobby(connected, roomCode.toUpperCase());
    });

    socket.on("lobby:start", () => {
      gameEngine.startMatch(connected.userId, gameEngine.findRoomByUser(connected.userId) ?? "");
    });

    socket.on("chat:send", ({ roomCode, message }) => {
      gameEngine.sendChat(roomCode, {
        userId: connected.userId,
        username: connected.username,
        message
      });
    });

    socket.on("match:attack", ({ roomCode, fromTerritoryId, toTerritoryId }) => {
      gameEngine.attack(connected.userId, roomCode, fromTerritoryId, toTerritoryId);
    });

    socket.on("match:answer", ({ roomCode, phaseId, answer }) => {
      gameEngine.answer(connected.userId, roomCode, phaseId, answer);
    });

    socket.on("match:duel-answer", ({ roomCode, duelId, answer }) => {
      gameEngine.duelAnswer(connected.userId, roomCode, duelId, answer);
    });
  });
}
