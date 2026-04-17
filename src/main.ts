import "reflect-metadata";
import { env } from "./infrastructure/config/env";
import { buildApp } from "./presentation/server";
import { buildContainer } from "./commons/container/container";


const bootstrap = async (): Promise<void> => {
  const container = await buildContainer();
  const app = buildApp(container);

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 API escuchando en http://localhost:${env.port} (${env.nodeEnv})`);
  });
};

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Error al iniciar la aplicación:", err);
  process.exit(1);
});
