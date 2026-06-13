import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000"
});

export interface AuthResponse {
  token: string;
  user: {
    userId: string;
    username: string;
    color: string;
    score: number;
    xp: number;
    rating: number;
    wins: number;
    losses: number;
    accuracy: number;
  };
}

export async function register(username: string, password: string) {
  const { data } = await api.post<AuthResponse>("/api/auth/register", { username, password });
  return data;
}

export async function login(username: string, password: string) {
  const { data } = await api.post<AuthResponse>("/api/auth/login", { username, password });
  return data;
}
