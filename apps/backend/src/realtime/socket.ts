import { Server as IOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { env } from "../config/env";

declare global {
  var __easyFoodIO: IOServer | undefined;
}

export function setIO(io: IOServer) {
  globalThis.__easyFoodIO = io;
}

export function getIO(): IOServer | undefined {
  return globalThis.__easyFoodIO;
}

export const vendorRoom = (vendorId: string) => `vendor:${vendorId}`;
export const orderRoom = (orderId: string) => `order:${orderId}`;

type BroadcastOrder = { id: string; items: { vendorId?: string }[] };

/**
 * Push a fresh copy of the order to anyone watching it: the customer's
 * tracking page (order:<id> room) and every vendor with a line item in it
 * (vendor:<vendorId> room). No-op if Socket.io never attached — callers
 * should still work correctly via polling/refetch-on-mutation.
 */
export function emitOrderUpdated(order: BroadcastOrder) {
  const io = getIO();
  if (!io) return;
  io.to(orderRoom(order.id)).emit("order:updated", order);
  const vendorIds = new Set(
    order.items.map((i) => i.vendorId).filter((v): v is string => Boolean(v)),
  );
  for (const vendorId of vendorIds)
    io.to(vendorRoom(vendorId)).emit("order:updated", order);
}

/**
 * Initializes Socket.io on the given HTTP server and wires up
 * room join/leave handling.
 */
export function initSocketIO(httpServer: HTTPServer): IOServer {
  const io = new IOServer(httpServer, {
    cors: {
      origin: env.frontendUrl,
      credentials: true,
    },
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    socket.on("join", (room: unknown) => {
      if (typeof room === "string" && room.length < 200) socket.join(room);
    });
    socket.on("leave", (room: unknown) => {
      if (typeof room === "string") socket.leave(room);
    });
  });

  setIO(io);
  console.log("[socket.io] attached to server at /socket.io");

  return io;
}
