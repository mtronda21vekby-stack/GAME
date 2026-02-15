import type { WSClient, WSMessage } from "@blackcrown/core";
import { createWS } from "@blackcrown/core";

export type Player = { name: string; ready: boolean };
export type ChatMsg = { id: string; name: string; text: string; ts: number };

export type LobbyState = {
  lobbyId: string;
  me: string;
  players: Player[];
  chat: ChatMsg[];
};

function upsertPlayer(players: Player[], p: Player): Player[] {
  const i = players.findIndex((x) => x.name === p.name);
  if (i === -1) return [...players, p].slice(0, 8);
  const next = players.slice();
  next[i] = p;
  return next;
}

export function createLobbyModel(opts: { lobbyId: string; me: string }) {
  const ws: WSClient = createWS(`mock://lobby:${opts.lobbyId}`);

  let state: LobbyState = {
    lobbyId: opts.lobbyId,
    me: opts.me,
    players: [{ name: opts.me, ready: false }],
    chat: []
  };

  const listeners = new Set<(s: LobbyState) => void>();

  const emit = () => { for (const l of listeners) l(state); };

  const connect = () => {
    ws.connect();
    ws.send({ type: "join", lobbyId: opts.lobbyId, name: opts.me });
    emit();
  };

  const dispose = () => {
    ws.send({ type: "leave", lobbyId: opts.lobbyId, name: opts.me });
    ws.close();
    listeners.clear();
  };

  ws.onMessage((m: WSMessage) => {
    if ("lobbyId" in m && m.lobbyId !== opts.lobbyId) return;

    if (m.type === "join") {
      state = { ...state, players: upsertPlayer(state.players, { name: m.name, ready: false }) };
      emit();
    }
    if (m.type === "leave") {
      state = { ...state, players: state.players.filter((p) => p.name !== m.name) };
      emit();
    }
    if (m.type === "ready") {
      state = { ...state, players: upsertPlayer(state.players, { name: m.name, ready: m.ready }) };
      emit();
    }
    if (m.type === "chat") {
      state = { ...state, chat: [...state.chat, { id: m.id, name: m.name, text: m.text, ts: m.ts }].slice(-120) };
      emit();
    }
    if (m.type === "snapshot") {
      state = { ...state, players: m.players.slice(0, 8), chat: m.chat.slice(-120) };
      emit();
    }
  });

  return {
    connect,
    dispose,
    subscribe: (cb: (s: LobbyState) => void) => { listeners.add(cb); cb(state); return () => listeners.delete(cb); },
    ready: (v: boolean) => { ws.send({ type: "ready", lobbyId: opts.lobbyId, name: opts.me, ready: v }); },
    chat: (msg: { id: string; text: string; ts: number }) => {
      ws.send({ type: "chat", lobbyId: opts.lobbyId, name: opts.me, text: msg.text, id: msg.id, ts: msg.ts });
    }
  };
}
