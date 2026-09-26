import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

let socket: Socket | undefined;

function getSocket(): Socket {
  if (!socket) {
    // In development, Vite proxies /socket.io to the backend (see vite.config.ts).
    // In production with same-domain deployment, this also works as-is.
    const url = import.meta.env.VITE_API_URL ?? "";
    socket = io(url || undefined, {
      path: "/socket.io",
      autoConnect: true,
      withCredentials: true,
    });
  }
  return socket;
}

/**
 * Joins `room` and calls `onUpdate` whenever the server pushes an
 * "order:updated" event into it. Safe to use even if Socket.io
 * never attached — it just never fires, so callers should pair this
 * with a normal query refetch-on-mutation/interval as a fallback.
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

export function useIsSocketConnected() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const s = getSocket();
    setIsConnected(s.connected);
    
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
    };
  }, []);

  return isConnected;
}
