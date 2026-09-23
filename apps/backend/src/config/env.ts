import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const isProd = process.env.NODE_ENV === "production";

export const env = {
  port: Number(process.env.PORT ?? 3001),
  mongodbUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/easyfood",
  jwtSecret: isProd
    ? required("JWT_SECRET")
    : (process.env.JWT_SECRET ?? "dev-only-insecure-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  isProd,
};
