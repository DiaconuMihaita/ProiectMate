import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? "mongodb://localhost:27017/mathquiztador",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173"
};
