import type { Plugin } from "vite";
import { Server as IOServer } from "socket.io";
import { setIO } from "../src/backend/realtime";

/**
 * Attaches a Socket.io server to Vite's own dev-server HTTP server so vendor
 * dashboards and order-tracking pages get instant push updates instead of
 * polling. Dev-only: `configureServer` never runs for `vite build`/`preview`,
 * so a production deploy needs its own long-lived Node process wired the
 * same way (see doc/MONGODB_BACKEND.md's "Known limitations").
 */
export function socketioPlugin(): Plugin {
  return {
    name: "easy-food-socketio",
    configureServer(server) {
      if (!server.httpServer) return; // middlewareMode / no HTTP server to attach to
      const io = new IOServer(server.httpServer, { path: "/socket.io" });
      io.on("connection", (socket) => {
        socket.on("join", (room: unknown) => {
          if (typeof room === "string" && room.length < 200) socket.join(room);
        });
        socket.on("leave", (room: unknown) => {
          if (typeof room === "string") socket.leave(room);
        });
      });
      setIO(io);
      console.log("[socket.io] attached to Vite dev server at /socket.io");
    },
  };
}
