import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@mathquiztador/shared";

export function createSocket(token: string): Socket<ServerToClientEvents, ClientToServerEvents> {
  return io(import.meta.env.VITE_SOCKET_URL ?? "http://localhost:4000", {
    transports: ["websocket"],
    auth: { token }
  });
}
