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

  jwtAccessSecret: isProd
    ? required("JWT_ACCESS_SECRET")
    : (process.env.JWT_ACCESS_SECRET ?? "dev-access-secret-change-me"),
  jwtRefreshSecret: isProd
    ? required("JWT_REFRESH_SECRET")
    : (process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-change-me"),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",

  jwtSecret: isProd
    ? required("JWT_ACCESS_SECRET")
    : (process.env.JWT_ACCESS_SECRET ??
      process.env.JWT_SECRET ??
      "dev-access-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",

  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  isProd,
};
