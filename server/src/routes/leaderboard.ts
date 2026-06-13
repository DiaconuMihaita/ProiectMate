import { Router } from "express";
import { UserModel } from "../models/User.js";

export const leaderboardRouter = Router();

leaderboardRouter.get("/elo", async (_req, res) => {
  const users = await UserModel.find()
    .sort({ rating: -1 })
    .limit(50)
    .select("username rating wins losses correctAnswers totalAnswers level xp");

  res.json(
    users.map((u) => ({
      username: u.username,
      rating: u.rating,
      wins: u.wins,
      losses: u.losses,
      level: u.level,
      xp: u.xp,
      accuracy: u.totalAnswers > 0 ? Math.round((u.correctAnswers / u.totalAnswers) * 100) : 0
    }))
  );
});
