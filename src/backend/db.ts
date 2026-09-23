import mongoose from "mongoose";
import { env } from "./env";

// Cached on `globalThis` so Vite's dev-server HMR (which re-evaluates this
// module on every edit) reuses the existing connection instead of opening a
// new one each time and leaking sockets.
declare global {
  var __easyFoodMongooseConn: Promise<typeof mongoose> | undefined;
}

export function connectDB(): Promise<typeof mongoose> {
  if (!globalThis.__easyFoodMongooseConn) {
    mongoose.set("strictQuery", true);
    globalThis.__easyFoodMongooseConn = mongoose.connect(env.mongodbUri);
  }
  return globalThis.__easyFoodMongooseConn;
}
