export type Topic =
  | "functions"
  | "limits"
  | "continuity"
  | "derivatives"
  | "function-study"
  | "primitives"
  | "integrals"
  | "matrices"
  | "determinants"
  | "vectors"
  | "trigonometry";

export type QuestionType =
  | "numeric"
  | "multiple-choice"
  | "true-false"
  | "expression-fill"
  | "step-by-step";

export interface Question {
  id: string;
  topic: Topic;
  type: QuestionType;
  prompt: string;
  options?: string[];
  answer: string | number | boolean;
  tolerance?: number;
  difficulty: "easy" | "medium" | "hard";
  timeLimitSec: number;
  explanation?: string;
}

export type Difficulty = "easy" | "medium" | "hard";

export interface PlayerPublic {
  userId: string;
  username: string;
  color: string;
  score: number;
  xp: number;
  rating: number;
  wins?: number;
  losses?: number;
  accuracy?: number;
}

export interface Territory {
  id: string;
  name: string;
  ownerUserId: string;
  neighbors: string[];
  x: number;
  y: number;
  value: number;
}

export interface GameMap {
  id: string;
  name: string;
  territories: Territory[];
}

export interface LobbyState {
  roomCode: string;
  hostUserId: string;
  mode: 2 | 3 | 4;
  difficulty: Difficulty;
  players: PlayerPublic[];
  started: boolean;
}

export type AttackStatus =
  | "idle"
  | "question"
  | "resolving"
  | "captured"
  | "defended"
  | "duel";

export interface AttackPhase {
  id: string;
  attackerUserId: string;
  defenderUserId: string;
  fromTerritoryId: string;
  toTerritoryId: string;
  question: Question;
  status: AttackStatus;
  startedAt: number;
  deadlineAt: number;
}

export interface DuelPhase {
  duelId: string;
  territoryId: string;
  challengers: string[];
  question: Question;
  startedAt: number;
  deadlineAt: number;
}

export interface MatchState {
  roomCode: string;
  mode: 2 | 3 | 4;
  turnOrder: string[];
  turnIndex: number;
  map: GameMap;
  players: PlayerPublic[];
  streaks: Record<string, number>;
  attackPhase?: AttackPhase;
  duelPhase?: DuelPhase;
  chat: Array<{ userId: string; username: string; message: string; ts: number }>;
  winnerUserId?: string;
}

export interface AuthPayload {
  sub: string;
  username: string;
}

export interface ClientToServerEvents {
  "auth:login": (payload: { username: string; password: string }) => void;
  "auth:register": (payload: { username: string; password: string }) => void;
  "lobby:create": (payload: { mode: 2 | 3; difficulty: Difficulty }) => void;
  "lobby:join": (payload: { roomCode: string }) => void;
  "lobby:start": () => void;
  "chat:send": (payload: { roomCode: string; message: string }) => void;
  "match:attack": (payload: {
    roomCode: string;
    fromTerritoryId: string;
    toTerritoryId: string;
  }) => void;
  "match:answer": (payload: {
    roomCode: string;
    phaseId: string;
    answer: string;
  }) => void;
  "match:duel-answer": (payload: {
    roomCode: string;
    duelId: string;
    answer: string;
  }) => void;
}

export interface ServerToClientEvents {
  "auth:ok": (payload: { token: string; user: PlayerPublic }) => void;
  "auth:error": (payload: { message: string }) => void;
  "lobby:update": (payload: LobbyState) => void;
  "lobby:error": (payload: { message: string }) => void;
  "match:update": (payload: MatchState) => void;
  "match:phase": (payload: { attackPhase?: AttackPhase; duelPhase?: DuelPhase }) => void;
  "match:result": (payload: { winnerUserId: string; roomCode: string }) => void;
  "chat:update": (payload: MatchState["chat"]) => void;
}
