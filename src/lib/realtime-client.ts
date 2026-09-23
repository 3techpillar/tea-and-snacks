import { useEffect } from "react";
import { io, type Socket } from "socket.io-client";

let socket: Socket | undefined;

function getSocket(): Socket {
  if (!socket) socket = io({ path: "/socket.io", autoConnect: true });
  return socket;
}

/**
 * Joins `room` and calls `onUpdate` whenever the server pushes an
 * "order:updated" event into it (see src/backend/realtime.ts). Safe to use
 * even if Socket.io never attached (e.g. a production build without a
 * persistent server) — it just never fires, so callers should pair this with
 * a normal query refetch-on-mutation/interval as a fallback.
 */
export function useOrderRoomUpdates(
  room: string | undefined,
  onUpdate: () => void,
) {
  useEffect(() => {
    if (!room) return;
    const s = getSocket();
    s.emit("join", room);
    s.on("order:updated", onUpdate);
    return () => {
      s.emit("leave", room);
      s.off("order:updated", onUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);
}
