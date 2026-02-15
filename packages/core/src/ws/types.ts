export type WSState = "idle" | "connecting" | "open" | "closed";

export type WSMessage =
  | { type: "join"; lobbyId: string; name: string }
  | { type: "leave"; lobbyId: string; name: string }
  | { type: "ready"; lobbyId: string; name: string; ready: boolean }
  | { type: "chat"; lobbyId: string; name: string; text: string; id: string; ts: number }
  | { type: "snapshot"; lobbyId: string; players: Array<{ name: string; ready: boolean }>; chat: Array<{ name: string; text: string; id: string; ts: number }> };

export type WSClient = {
  state: () => WSState;
  connect: () => void;
  close: () => void;
  send: (msg: WSMessage) => void;
  onMessage: (cb: (msg: WSMessage) => void) => () => void;
  onState: (cb: (s: WSState) => void) => () => void;
};
