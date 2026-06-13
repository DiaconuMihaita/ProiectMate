import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type {
  AttackPhase,
  DuelPhase,
  LobbyState,
  MatchState,
  PlayerPublic,
  Territory
} from "../../shared/src/index.ts";
import { login, register } from "./lib/api";
import type { AuthResponse } from "./lib/api";
import { createSocket } from "./lib/socket";
import type { Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "../../shared/src/index.ts";

function cardClass(extra = "") {
  return `glass rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)] ${extra}`;
}

export function App() {
  const [token, setToken] = useState(localStorage.getItem("mq_token") ?? "");
  const [user, setUser] = useState<PlayerPublic | null>(null);
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [match, setMatch] = useState<MatchState | null>(null);
  const [attackPhase, setAttackPhase] = useState<AttackPhase | undefined>();
  const [duelPhase, setDuelPhase] = useState<DuelPhase | undefined>();
  const [chatMessage, setChatMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    const s = createSocket(token);
    setSocket(s);

    s.on("lobby:update", setLobby);
    s.on("match:update", setMatch);
    s.on("match:phase", ({ attackPhase: a, duelPhase: d }: { attackPhase?: AttackPhase; duelPhase?: DuelPhase }) => {
      setAttackPhase(a);
      setDuelPhase(d);
    });

    s.on("match:result", ({ winnerUserId }) => {
      if (!match) return;
      const winner = match.players.find((p) => p.userId === winnerUserId);
      if (winner) {
        alert(`Castigator: ${winner.username}`);
      }
    });

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [token]);

  if (!token || !user) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center p-6">
        <AuthPanel
          onAuth={(payload) => {
            setToken(payload.token);
            setUser(payload.user);
            localStorage.setItem("mq_token", payload.token);
          }}
        />
      </div>
    );
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-4 p-4 lg:grid-cols-[360px_1fr_320px]">
      <motion.section initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={cardClass()}>
        <h1 className="font-display text-3xl font-extrabold text-pulse">MathQuiztador</h1>
        <p className="mt-1 text-sm text-mist">Conquista prin matematica de clasa a XI-a</p>
        <ProfileCard user={user} />

        {!match && (
          <LobbyPanel
            socket={socket}
            lobby={lobby}
            user={user}
            onLeave={() => setLobby(null)}
          />
        )}

        {match && <PlayersPanel match={match} />}
      </motion.section>

      <motion.section initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={cardClass("overflow-hidden")}>
        {!match ? (
          <div className="flex h-full min-h-[420px] items-center justify-center text-mist">
            Creeaza sau intra intr-un lobby pentru a incepe meciul.
          </div>
        ) : (
          <MapBoard socket={socket} match={match} user={user} />
        )}
      </motion.section>

      <motion.section initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={cardClass("flex flex-col gap-3")}>
        <h2 className="font-display text-xl font-bold">Chat live</h2>
        <div className="h-[320px] overflow-auto rounded-xl border border-white/10 p-3">
          {(match?.chat ?? []).map((msg) => (
            <p key={`${msg.userId}-${msg.ts}`} className="mb-2 text-sm text-slate-200">
              <span className="font-bold text-pulse">{msg.username}:</span> {msg.message}
            </p>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="w-full rounded-lg border border-white/20 bg-slate-900/60 p-2"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Scrie mesaj..."
          />
          <button
            className="rounded-lg bg-ember px-3 py-2 font-semibold"
            onClick={() => {
              if (!match || !chatMessage.trim()) return;
              socket?.emit("chat:send", { roomCode: match.roomCode, message: chatMessage });
              setChatMessage("");
            }}
          >
            Trimite
          </button>
        </div>
      </motion.section>

      {attackPhase && match && (
        <QuestionModal
          title="Atac matematic"
          question={attackPhase.question.prompt}
          onSubmit={(answer) =>
            socket?.emit("match:answer", {
              roomCode: match.roomCode,
              phaseId: attackPhase.id,
              answer
            })
          }
        />
      )}

      {duelPhase && match && (
        <QuestionModal
          title="Duel matematic"
          question={duelPhase.question.prompt}
          accent="bg-rose-600"
          onSubmit={(answer) =>
            socket?.emit("match:duel-answer", {
              roomCode: match.roomCode,
              duelId: duelPhase.duelId,
              answer
            })
          }
        />
      )}
    </main>
  );
}

function AuthPanel({
  onAuth
}: {
  onAuth: (payload: AuthResponse) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (mode: "login" | "register") => {
    setError("");
    try {
      const payload =
        mode === "login" ? await login(username.trim(), password) : await register(username.trim(), password);
      onAuth(payload);
    } catch (e) {
      setError("Autentificare esuata. Verifica datele.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cardClass("w-full max-w-lg")}> 
      <h2 className="font-display text-4xl font-black">Intra in Arena</h2>
      <p className="mt-2 text-mist">Lupte de teritoriu pe intrebari de matematica.</p>
      <div className="mt-6 space-y-3">
        <input
          className="w-full rounded-xl border border-white/20 bg-slate-900/70 p-3"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          className="w-full rounded-xl border border-white/20 bg-slate-900/70 p-3"
          placeholder="Parola"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
      <div className="mt-6 flex gap-3">
        <button className="rounded-xl bg-pulse px-4 py-2 font-bold text-ink" onClick={() => submit("login")}>Login</button>
        <button className="rounded-xl bg-lime px-4 py-2 font-bold text-ink" onClick={() => submit("register")}>Register</button>
      </div>
    </motion.div>
  );
}

function ProfileCard({ user }: { user: PlayerPublic }) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
      <div className="rounded-xl border border-white/15 p-2">Nivel: {Math.max(1, Math.floor(user.xp / 250))}</div>
      <div className="rounded-xl border border-white/15 p-2">XP: {user.xp}</div>
      <div className="rounded-xl border border-white/15 p-2">Elo: {user.rating}</div>
      <div className="rounded-xl border border-white/15 p-2">Scor: {user.score}</div>
      <div className="rounded-xl border border-white/15 p-2">Victorii: {user.wins ?? 0}</div>
      <div className="rounded-xl border border-white/15 p-2">Infrangeri: {user.losses ?? 0}</div>
      <div className="col-span-2 rounded-xl border border-white/15 p-2">Acuratete: {user.accuracy ?? 0}%</div>
    </div>
  );
}

function LobbyPanel({
  socket,
  lobby,
  user
}: {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  lobby: LobbyState | null;
  user: PlayerPublic;
  onLeave: () => void;
}) {
  const [roomCode, setRoomCode] = useState("");
  const [mode, setMode] = useState<2 | 3>(2);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  if (lobby) {
    const isHost = lobby.hostUserId === user.userId;
    return (
      <div className="mt-5 space-y-3">
        <p className="rounded-xl border border-white/15 p-2">Cod lobby: {lobby.roomCode}</p>
        <p className="text-sm text-mist">Jucatori: {lobby.players.length}/{lobby.mode}</p>
        {lobby.players.map((p) => (
          <p key={p.userId} className="text-sm">{p.username}</p>
        ))}
        {isHost && (
          <button
            className="w-full rounded-xl bg-ember px-4 py-2 font-bold"
            onClick={() => socket?.emit("lobby:start")}
          >
            Start meci
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-3">
      <h3 className="font-display text-xl font-bold">Lobby</h3>
      <div className="grid grid-cols-2 gap-2">
        <select
          className="rounded-lg border border-white/15 bg-slate-900/70 p-2"
          value={String(mode)}
          onChange={(e) => setMode(Number(e.target.value) as 2 | 3)}
        >
          <option value="2">1v1</option>
          <option value="3">1v1v1</option>
        </select>
        <select
          className="rounded-lg border border-white/15 bg-slate-900/70 p-2"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
        >
          <option value="easy">Usor</option>
          <option value="medium">Mediu</option>
          <option value="hard">Greu</option>
        </select>
      </div>
      <button
        className="w-full rounded-xl bg-pulse px-4 py-2 font-bold text-ink"
        onClick={() => socket?.emit("lobby:create", { mode, difficulty })}
      >
        Creeaza camera
      </button>
      <div className="flex gap-2">
        <input
          className="w-full rounded-lg border border-white/15 bg-slate-900/70 p-2"
          placeholder="Cod invitatie"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
        />
        <button
          className="rounded-lg bg-lime px-3 py-2 font-bold text-ink"
          onClick={() => socket?.emit("lobby:join", { roomCode })}
        >
          Join
        </button>
      </div>
    </div>
  );
}

function PlayersPanel({ match }: { match: MatchState }) {
  return (
    <div className="mt-4 space-y-2">
      <h3 className="font-display text-xl font-bold">Meci activ</h3>
      <p className="text-sm text-mist">Tura: {match.players[match.turnIndex]?.username}</p>
      {match.players.map((p) => (
        <div key={p.userId} className="rounded-xl border border-white/15 p-2 text-sm">
          <div className="flex justify-between">
            <strong>{p.username}</strong>
            <span>{p.score} pct</span>
          </div>
          <div className="text-xs text-mist">Serie: {match.streaks[p.userId] ?? 0}</div>
        </div>
      ))}
    </div>
  );
}

function MapBoard({
  socket,
  match,
  user
}: {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  match: MatchState;
  user: PlayerPublic;
}) {
  const [selectedFrom, setSelectedFrom] = useState<Territory | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const playersById = useMemo(() => {
    return Object.fromEntries(match.players.map((p) => [p.userId, p]));
  }, [match.players]);

  const onTerritoryClick = (territory: Territory) => {
    if (!selectedFrom) {
      if (territory.ownerUserId === user.userId) {
        setSelectedFrom(territory);
      }
      return;
    }

    if (selectedFrom.id === territory.id) {
      setSelectedFrom(null);
      return;
    }

    if (selectedFrom.neighbors.includes(territory.id) && territory.ownerUserId !== user.userId) {
      socket?.emit("match:attack", {
        roomCode: match.roomCode,
        fromTerritoryId: selectedFrom.id,
        toTerritoryId: territory.id
      });
      setSelectedFrom(null);
    }
  };

  return (
    <div className="flex h-full min-h-[520px] flex-col">
      <div className="mb-3 flex items-center justify-between text-sm">
        <p className="text-mist">Click pe un teritoriu al tau, apoi pe vecinul pe care vrei sa-l ataci.</p>
        <div className="flex gap-2">
          <button className="rounded-lg border border-white/15 px-3 py-1" onClick={() => setScale((s) => Math.min(2, s + 0.1))}>+</button>
          <button className="rounded-lg border border-white/15 px-3 py-1" onClick={() => setScale((s) => Math.max(0.8, s - 0.1))}>-</button>
        </div>
      </div>
      <div
        className="relative flex-1 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40"
        onMouseDown={(e) => {
          setDragging(true);
          startRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
        }}
        onMouseMove={(e) => {
          if (!dragging) return;
          setOffset({
            x: startRef.current.ox + (e.clientX - startRef.current.x),
            y: startRef.current.oy + (e.clientY - startRef.current.y)
          });
        }}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "center"
          }}
        >
          {match.map.territories.map((t) => {
            const owner = playersById[t.ownerUserId];
            const isSelected = selectedFrom?.id === t.id;

            return (
              <motion.button
                key={t.id}
                whileTap={{ scale: 0.95 }}
                className="territory absolute h-20 w-28 -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 p-2 text-left"
                style={{
                  left: `${t.x}%`,
                  top: `${t.y}%`,
                  backgroundColor: `${owner?.color ?? "#334155"}22`,
                  borderColor: owner?.color ?? "#64748b",
                  boxShadow: isSelected ? `0 0 0 3px #ffffff66` : "none"
                }}
                onClick={() => onTerritoryClick(t)}
              >
                <p className="text-xs font-bold">{t.name}</p>
                <p className="text-[11px] text-slate-300">{owner?.username ?? "Neutru"}</p>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function QuestionModal({
  title,
  question,
  onSubmit,
  accent = "bg-pulse"
}: {
  title: string;
  question: string;
  onSubmit: (answer: string) => void;
  accent?: string;
}) {
  const [answer, setAnswer] = useState("");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cardClass("w-full max-w-xl")}> 
        <div className={`inline-block rounded-full px-3 py-1 text-xs font-bold text-black ${accent}`}>{title}</div>
        <h3 className="mt-4 font-display text-2xl font-black">{question}</h3>
        <input
          className="mt-4 w-full rounded-xl border border-white/20 bg-slate-900/70 p-3"
          placeholder="Raspuns..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
        <button
          className="mt-4 rounded-xl bg-ember px-4 py-2 font-bold"
          onClick={() => {
            onSubmit(answer);
            setAnswer("");
          }}
        >
          Trimite raspuns
        </button>
      </motion.div>
    </div>
  );
}
