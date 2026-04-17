import dotenv from "dotenv";

dotenv.config();

const required = (name: string, fallback?: string): string => {
  const v = process.env[name] ?? fallback;
  if (v === undefined) {
    throw new Error(`Falta la variable de entorno: ${name}`);
  }
  return v;
};

const parseBool = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "y"].includes(value.toLowerCase());
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),

  db: {
    type: (process.env.DB_TYPE ?? "sqlite") as "sqlite" | "postgres" | "mssql",
    database: process.env.DB_DATABASE ?? "./data/app.db",
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    ssl: parseBool(process.env.DB_SSL, true),
    // Útil para Azure SQL (deja true) o SQL Server local con certificado self-signed (true).
    trustServerCertificate: parseBool(process.env.DB_TRUST_SERVER_CERTIFICATE, false),
    // En producción conviene apagarlo y usar migraciones.
    synchronize: parseBool(process.env.DB_SYNCHRONIZE, false)
  },

  jwt: {
    secret: required("JWT_SECRET", "dev-secret-change-me"),
    expiresIn: process.env.JWT_EXPIRES_IN ?? "1h"
  },

  coingecko: {
    baseUrl: process.env.COINGECKO_BASE_URL ?? "https://api.coingecko.com/api/v3",
    defaultVsCurrency: process.env.COINGECKO_DEFAULT_VS_CURRENCY ?? "usd"
  },

  azureStorage: {
    account: process.env.AZURE_STORAGE_ACCOUNT,
    key: process.env.AZURE_STORAGE_KEY,
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    container: process.env.AZURE_STORAGE_CONTAINER ?? "uploads",
    sasTtlMinutes: Number(process.env.AZURE_STORAGE_SAS_TTL_MINUTES ?? 10)
  }
};
