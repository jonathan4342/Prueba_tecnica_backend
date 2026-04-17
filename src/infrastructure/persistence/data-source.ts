import "reflect-metadata";
import fs from "fs";
import path from "path";
import { DataSource, DataSourceOptions } from "typeorm";
import { env } from "../config/env";
import { UserEntity } from "./entities/UserEntity";
import { CryptoQueryLogEntity } from "./entities/CryptoQueryLogEntity";

const baseEntities = [UserEntity, CryptoQueryLogEntity];

if (env.db.type === "sqlite") {
  const dir = path.dirname(env.db.database);
  if (dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const buildOptions = (): DataSourceOptions => {
  switch (env.db.type) {
    case "mssql":
      return {
        type: "mssql",
        host: env.db.host,
        port: env.db.port ?? 1433,
        username: env.db.username,
        password: env.db.password,
        database: env.db.database,
        entities: baseEntities,
        synchronize: env.db.synchronize,
        // Requerido por Azure SQL: fuerza TLS y confía en el certificado emitido por Microsoft.
        options: {
          encrypt: env.db.ssl,
          trustServerCertificate: env.db.trustServerCertificate
        },
        extra: {
          // Azure SQL cierra conexiones inactivas; mantiene el pool sano.
          pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
          }
        }
      };

    case "postgres":
      return {
        type: "postgres",
        host: env.db.host,
        port: env.db.port,
        username: env.db.username,
        password: env.db.password,
        database: env.db.database,
        entities: baseEntities,
        synchronize: env.db.synchronize,
        ssl: env.db.ssl ? { rejectUnauthorized: false } : false
      };

    case "sqlite":
    default:
      return {
        type: "sqlite",
        database: env.db.database,
        entities: baseEntities,
        synchronize: env.db.synchronize
      };
  }
};

export const AppDataSource = new DataSource(buildOptions());
