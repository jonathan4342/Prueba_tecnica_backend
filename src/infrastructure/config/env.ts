import dotenv from "dotenv";

dotenv.config();

const required = (name: string, fallback?: string): string => {
  const v = process.env[name] ?? fallback;
  if (v === undefined) {
    throw new Error(`Falta la variable de entorno: ${name}`);
  }
  return v;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),

  db: {
    type: (process.env.DB_TYPE ?? "sqlite") as "sqlite" | "postgres",
    database: process.env.DB_DATABASE ?? "./data/app.db",
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === "true"
  },

  jwt: {
    secret: required("JWT_SECRET", "dev-secret-change-me"),
    expiresIn: process.env.JWT_EXPIRES_IN ?? "1h"
  },

  coingecko: {
    baseUrl: process.env.COINGECKO_BASE_URL ?? "https://api.coingecko.com/api/v3",
    defaultVsCurrency: process.env.COINGECKO_DEFAULT_VS_CURRENCY ?? "usd"
  }
};
