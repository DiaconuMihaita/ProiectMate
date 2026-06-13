import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserModel } from "../models/User.js";
import { signToken } from "../auth.js";

const schema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6).max(120)
});

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Date invalide." });
  }

  const exists = await UserModel.findOne({ username: parsed.data.username });
  if (exists) {
    return res.status(409).json({ message: "Username deja existent." });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await UserModel.create({
    username: parsed.data.username,
    passwordHash
  });

  const token = signToken({ sub: user._id.toString(), username: user.username });

  return res.json({
    token,
    user: {
      userId: user._id.toString(),
      username: user.username,
      color: "#22d3ee",
      score: 0,
      xp: user.xp,
      rating: user.rating,
      wins: user.wins,
      losses: user.losses,
      accuracy: 0
    }
  });
});

authRouter.post("/login", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Date invalide." });
  }

  const user = await UserModel.findOne({ username: parsed.data.username });
  if (!user) {
    return res.status(401).json({ message: "Credentiale invalide." });
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Credentiale invalide." });
  }

  const token = signToken({ sub: user._id.toString(), username: user.username });

  return res.json({
    token,
    user: {
      userId: user._id.toString(),
      username: user.username,
      color: "#22d3ee",
      score: 0,
      xp: user.xp,
      rating: user.rating,
      wins: user.wins,
      losses: user.losses,
      accuracy: user.totalAnswers > 0 ? Math.round((user.correctAnswers / user.totalAnswers) * 100) : 0
    }
  });
});
