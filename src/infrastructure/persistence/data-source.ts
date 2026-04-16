import "reflect-metadata";
import fs from "fs";
import path from "path";
import { DataSource, DataSourceOptions } from "typeorm";
import { env } from "../config/env";
import { UserEntity } from "./entities/UserEntity";
import { CryptoQueryLogEntity } from "./entities/CryptoQueryLogEntity";

const baseEntities = [UserEntity, CryptoQueryLogEntity];

// Asegura que el directorio para SQLite exista antes de que TypeORM intente abrir el archivo.
if (env.db.type === "sqlite") {
  const dir = path.dirname(env.db.database);
  if (dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const options: DataSourceOptions =
  env.db.type === "postgres"
    ? {
        type: "postgres",
        host: env.db.host,
        port: env.db.port,
        username: env.db.username,
        password: env.db.password,
        database: env.db.database,
        entities: baseEntities,
        synchronize: true, // En producción real: usar migraciones.
        ssl: env.db.ssl ? { rejectUnauthorized: false } : false
      }
    : {
        type: "sqlite",
        database: env.db.database,
        entities: baseEntities,
        synchronize: true
      };

export const AppDataSource = new DataSource(options);
