# Prueba Técnica Backend Junior

API REST en **Node.js + Express + TypeScript** con **arquitectura hexagonal** (puertos y adaptadores), **contenedor de inyección de dependencias Inversify** y **capa de presentación** separada con presenters que implementan interfaces genéricas. Consume la API pública financiera de **CoinGecko**, transforma la respuesta y expone un endpoint propio `GET /external-data`.

## ¿Qué hace el proyecto?

1. Expone `GET /external-data` que consulta CoinGecko, transforma el JSON y devuelve una lista de activos con la forma:

```json
[
  {
    "id": "bitcoin",
    "symbol": "BTC",
    "name": "Bitcoin",
    "price": 67543.21,
    "currency": "USD",
    "rank": 1,
    "change24hPercent": 2.15,
    "trend": "up",
    "lastUpdated": "2026-04-16T10:05:12.000Z"
  }
]
```

2. Autenticación JWT: `POST /auth/register` y `POST /auth/login`. `/external-data` requiere `Authorization: Bearer <token>`.
3. Persistencia con **TypeORM** (SQLite por defecto, **SQL Server / Azure SQL** en producción) usando *entities* y *repositories*.
4. Registro de cada consulta al endpoint externo en la tabla `crypto_query_logs`.
5. Manejo centralizado de errores con clases de dominio (`AppError`, `ValidationError`, `UnauthorizedError`, …).
6. Tests unitarios y de integración (Jest + supertest) que corren sin red ni base de datos.

## API externa utilizada

**CoinGecko** — `https://api.coingecko.com/api/v3/coins/markets`. Es pública, gratuita, sin API key para el uso básico y devuelve datos financieros reales de criptoactivos.

## Cómo ejecutarlo localmente

Requisitos: Node.js 18+.

```bash
# 1. Clonar e instalar
git clone <tu-repo>.git
cd Prueba_tecnica_backend
npm install

# 2. Variables de entorno
cp .env.example .env
# Edita .env si quieres cambiar puerto, secreto JWT, etc.

# 3. Levantar en modo dev (recarga automática)
npm run dev

# 4. O compilar y arrancar
npm run build
npm start
```

La API queda en `http://localhost:3000`.

### Probar el flujo completo

```bash
# Health
curl http://localhost:3000/health

# Registro
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"papi@example.com","password":"secret123"}'

# Login -> devuelve { token }
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"papi@example.com","password":"secret123"}' | jq -r .token)

# Endpoint principal (protegido)
curl "http://localhost:3000/external-data?limit=5&vs=usd" \
  -H "Authorization: Bearer $TOKEN"
```

### Tests

```bash
npm test
```

### Docker

```bash
docker compose up --build
# API disponible en http://localhost:3000
```

## Estructura del proyecto

Cuatro capas claramente separadas: **domain** (núcleo), **application** (casos de uso), **presentation** (controllers + presenters + views) e **infrastructure** (adaptadores concretos + Inversify).

```
src/
├── domain/                         # NÚCLEO — sin dependencias externas
│   ├── entities/
│   │   ├── User.ts
│   │   └── CryptoAsset.ts          # value object + regla isBullish()
│   └── ports/
│       ├── shared/                 # === INTERFACES GENÉRICAS ===
│       │   ├── IRepository.ts        # IRepository<T, ID>
│       │   ├── IUseCase.ts           # IUseCase<TInput, TOutput>
│       │   └── IExternalDataProvider.ts  # IExternalDataProvider<TQuery, TResult>
│       ├── in/                     # driving ports (casos de uso)
│       │   ├── IGetTopCryptoAssetsUseCase.ts   # = IUseCase<…, CryptoAsset[]>
│       │   ├── IRegisterUserUseCase.ts
│       │   └── ILoginUserUseCase.ts
│       └── out/                    # driven ports (salida del hexágono)
│           ├── IUserRepository.ts              # extends IRepository<User>
│           ├── ICryptoQueryLogRepository.ts    # = IRepository<CryptoQueryLog>
│           ├── ICryptoProvider.ts              # = IExternalDataProvider<…>
│           ├── ITokenService.ts
│           └── IPasswordHasher.ts
│
├── application/                    # Casos de uso (IUseCase.execute())
│   └── use-cases/
│       ├── GetTopCryptoAssetsUseCase.ts
│       ├── RegisterUserUseCase.ts
│       └── LoginUserUseCase.ts
│
├── presentation/                   # === CAPA DE PRESENTACIÓN (HTTP) ===
│   ├── shared/
│   │   └── IPresenter.ts           # IPresenter<TDomain, TView>
│   ├── views/                      # Tipos view model (CryptoAssetView, LoginView…)
│   ├── presenters/                 # Implementan IPresenter<…>
│   │   ├── CryptoAssetPresenter.ts
│   │   └── AuthPresenter.ts
│   ├── controllers/                # HTTP → caso de uso → presenter → JSON
│   │   ├── CryptoController.ts
│   │   ├── AuthController.ts
│   │   └── HealthController.ts
│   ├── middlewares/                # AuthMiddleware (usa ITokenService), errorHandler
│   │   ├── authMiddleware.ts
│   │   └── errorHandler.ts
│   ├── routes/                     # Routers Express (auth, crypto, health)
│   │   ├── authRoutes.ts
│   │   ├── cryptoRoutes.ts
│   │   └── healthRoutes.ts
│   └── server.ts                   # buildApp(container): resuelve controllers desde el Container
│
├── infrastructure/                 # === ADAPTADORES DRIVEN ===
│   ├── config/env.ts
│   ├── external/
│   │   └── CoinGeckoAdapter.ts     # implements ICryptoProvider
│   ├── persistence/
│   │   ├── data-source.ts
│   │   ├── entities/               # TypeORM entities
│   │   └── repositories/           # TypeOrm*Repository (implementan IRepository)
│   └── security/
│       ├── JwtTokenService.ts      # implements ITokenService
│       └── BcryptPasswordHasher.ts # implements IPasswordHasher
│
├── shared/
│   ├── container/                  # === INVERSIFY ===
│   │   ├── types.ts                #   Symbols (TYPES)
│   │   └── container.ts            #   bindings interfaz → implementación
│   └── errors/AppError.ts
└── main.ts                         # Bootstrap: buildContainer() → buildApp() → listen
tests/
├── unit/
│   ├── GetTopCryptoAssetsUseCase.test.ts   # mocks de puertos, sin DI
│   └── CryptoAssetPresenter.test.ts
└── integration/
    └── externalData.e2e.test.ts            # Container con bindings in-memory
```

### Interfaces genéricas (uno de los cambios clave)

En vez de tener una interfaz específica por cada repositorio o caso de uso, el dominio define **cuatro interfaces genéricas** parametrizadas:

| Interfaz genérica | Usada para | Ejemplo concreto |
| ----------------- | ---------- | ---------------- |
| `IRepository<T, ID>` | Persistencia | `IUserRepository extends IRepository<User, string>` |
| `IUseCase<TInput, TOutput>` | Casos de uso | `ILoginUserUseCase = IUseCase<LoginUserInput, LoginUserOutput>` |
| `IExternalDataProvider<TQuery, TResult>` | Proveedores externos | `ICryptoProvider = IExternalDataProvider<CryptoProviderQuery, CryptoAsset[]>` |
| `IPresenter<TDomain, TView>` | Presentación | `CryptoAssetPresenter implements IPresenter<CryptoAsset, CryptoAssetView>` |

Cada clase concreta **implementa la interfaz genérica con tipos específicos**. Esto nos da una forma uniforme de hablar de cualquier repositorio, caso de uso, proveedor o presentador sin referirnos a la entidad.

### Contenedor de dependencias (Inversify)

`src/shared/container/container.ts` construye un `Container` de Inversify con bindings del tipo *interfaz → implementación*:

```ts
container.bind<ICryptoProvider>(TYPES.CryptoProvider).to(CoinGeckoAdapter);
container.bind<ITokenService>(TYPES.TokenService).to(JwtTokenService);
container.bind<IGetTopCryptoAssetsUseCase>(TYPES.GetTopCryptoAssetsUseCase)
  .to(GetTopCryptoAssetsUseCase);
container.bind<CryptoController>(TYPES.CryptoController).to(CryptoController);
```

Cada clase lleva `@injectable()` y declara sus dependencias con `@inject(TYPES.Xxx)` en el constructor. Cambiar de CoinGecko a Binance es **una línea** en este archivo; el resto del código ni se entera.

### ¿Por qué esta arquitectura?

- **Reemplazabilidad:** los adaptadores se enchufan y desenchufan desde un único sitio (`container.ts`). Cambiar CoinGecko por Binance, bcrypt por argon2, o TypeORM por Prisma sólo toca la infraestructura.
- **Testabilidad:** los casos de uso y presenters se testean con mocks triviales de los puertos (`tests/unit/*.test.ts`). Los tests e2e montan un `Container` con bindings in-memory (`tests/integration/*`); no se abre un socket a CoinGecko ni una conexión a SQLite.
- **Presentación aislada:** la forma del JSON que ve el cliente vive sólo en `presentation/presenters/*` y `presentation/views/*`. Ni el caso de uso ni el controlador saben cómo se serializa un asset.
- **Aislamiento del dominio:** `src/domain` no importa Express, axios, TypeORM, bcrypt, Inversify ni Jest. Es código puro, fácilmente portable.

## Endpoints

| Método | Ruta | Auth | Descripción |
| ------ | ---- | ---- | ----------- |
| GET    | `/health`          | No  | Estado del servicio |
| POST   | `/auth/register`   | No  | `{ email, password }` → `{ id, email }` |
| POST   | `/auth/login`      | No  | `{ email, password }` → `{ token, expiresIn }` |
| GET    | `/external-data`   | Sí  | query: `limit` (1-100), `vs` (usd, eur, …). Devuelve array de `CryptoAssetDto` |

## Variables de entorno

Ver `.env.example`. Las más relevantes:

| Variable | Descripción | Por defecto |
| -------- | ----------- | ----------- |
| `PORT` | Puerto HTTP | `3000` |
| `DB_TYPE` | `sqlite`, `postgres` o `mssql` | `sqlite` |
| `DB_HOST` | Host (SQL Server / Postgres) | — |
| `DB_PORT` | Puerto (SQL Server: `1433`) | — |
| `DB_USERNAME` | Usuario | — |
| `DB_PASSWORD` | Password | — |
| `DB_DATABASE` | Ruta SQLite o nombre de BD | `./data/app.db` |
| `DB_SSL` | TLS contra la BD (true en Azure) | `true` |
| `DB_TRUST_SERVER_CERTIFICATE` | Confiar en cert self-signed (SQL Server local) | `false` |
| `DB_SYNCHRONIZE` | TypeORM sincroniza el esquema al arrancar | `false` |
| `JWT_SECRET` | Secreto para firmar JWT | (obligatorio en prod) |
| `JWT_EXPIRES_IN` | Expiración | `1h` |
| `COINGECKO_BASE_URL` | URL base de la API externa | `https://api.coingecko.com/api/v3` |
| `AZURE_STORAGE_ACCOUNT` | Cuenta de Storage para SAS | — |
| `AZURE_STORAGE_KEY` | Clave primaria de la cuenta | — |
| `AZURE_STORAGE_CONTAINER` | Contenedor de blobs | `uploads` |
| `AZURE_STORAGE_SAS_TTL_MINUTES` | Duración del SAS | `10` |

---

## Despliegue en Azure

### Arquitectura propuesta

```
GitHub (main) ──► GitHub Actions ──► Azure App Service (Node 20, Linux)
                                               │
                                               ├── Azure SQL Database (TypeORM, driver mssql)
                                               └── Azure Blob Storage (uploads firmados con SAS)
```

Tres recursos por encima del App Service: **Resource Group**, **App Service Plan** y **SQL Server**. Todo puede montarse desde la CLI (`az`) o desde el portal; a continuación el camino por CLI, que es el más reproducible.

### 1. Crear Resource Group y App Service (Node 20)

```bash
az login

RG=prueba-backend-rg
APP=prueba-tecnica-api
LOCATION=eastus2

az group create -n $RG -l $LOCATION
az appservice plan create -g $RG -n ${APP}-plan --sku B1 --is-linux
az webapp create -g $RG -p ${APP}-plan -n $APP --runtime "NODE:20-lts"

# Azure pone la app a escuchar en $PORT y espera `npm start`.
# Nuestro `package.json` ya expone `start = node dist/main.js`, así que no hace falta custom startup command.
az webapp config set -g $RG -n $APP --startup-file "npm start"
```

La app queda accesible en `https://<APP>.azurewebsites.net` con HTTPS y certificado gestionado por Azure.

### 2. Crear Azure SQL Database

```bash
SQL_SERVER=prueba-sql-$RANDOM          # nombre DNS globalmente único
SQL_DB=appdb
SQL_ADMIN=adminuser
SQL_PASSWORD='Str0ng!Passw0rd_ChangeMe'

az sql server create \
  -g $RG -n $SQL_SERVER -l $LOCATION \
  --admin-user $SQL_ADMIN --admin-password "$SQL_PASSWORD"

# Permite que los servicios de Azure (App Service) lleguen al server.
az sql server firewall-rule create \
  -g $RG -s $SQL_SERVER \
  -n AllowAzureServices --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0

az sql db create \
  -g $RG -s $SQL_SERVER -n $SQL_DB \
  --service-objective Basic
```

Esto genera el host `<SQL_SERVER>.database.windows.net`, puerto **1433**, TLS obligatorio. TypeORM ya está configurado para usar el driver `mssql` cuando `DB_TYPE=mssql`; el paquete `mssql` está en `package.json`.

> La primera vez, lanzar la app con `DB_SYNCHRONIZE=true` basta para que TypeORM cree las tablas `users` y `crypto_query_logs`. En entornos reales se migraría a `typeorm migration:run` durante el deploy y se dejaría `DB_SYNCHRONIZE=false`.

### 3. Configurar variables de entorno (App Settings)

En App Service las *Application settings* se inyectan como `process.env.X`:

```bash
az webapp config appsettings set -g $RG -n $APP --settings \
  NODE_ENV=production \
  PORT=8080 \
  DB_TYPE=mssql \
  DB_HOST=${SQL_SERVER}.database.windows.net \
  DB_PORT=1433 \
  DB_USERNAME=${SQL_ADMIN} \
  DB_PASSWORD="$SQL_PASSWORD" \
  DB_DATABASE=${SQL_DB} \
  DB_SSL=true \
  DB_TRUST_SERVER_CERTIFICATE=false \
  DB_SYNCHRONIZE=true \
  JWT_SECRET='<secreto-fuerte>' \
  JWT_EXPIRES_IN=1h \
  COINGECKO_BASE_URL=https://api.coingecko.com/api/v3 \
  COINGECKO_DEFAULT_VS_CURRENCY=usd \
  AZURE_STORAGE_ACCOUNT=pruebastoracct \
  AZURE_STORAGE_CONTAINER=uploads \
  AZURE_STORAGE_SAS_TTL_MINUTES=10 \
  SCM_DO_BUILD_DURING_DEPLOYMENT=false
```

Secretos (`JWT_SECRET`, `DB_PASSWORD`, `AZURE_STORAGE_KEY`) deben moverse a **Azure Key Vault** y referenciarse con `@Microsoft.KeyVault(SecretUri=...)`. `SCM_DO_BUILD_DURING_DEPLOYMENT=false` porque el artefacto ya incluye `dist/` y `node_modules/` desde el pipeline.

### 4. Despliegue desde GitHub

Hay dos maneras; la que trae este repo ya montada es la **B**.

**A) Deployment Center (GUI).** Portal → App Service → *Deployment Center* → *GitHub* → autorizar → elegir repo y branch `main`. Azure inyecta su propio workflow.

**B) GitHub Actions (incluido en este repo).** El workflow `.github/workflows/azure-deploy.yml` hace:

1. `npm ci && npm run build && npm test`.
2. Empaqueta `dist/`, `node_modules/` y `package.json` en un zip.
3. Publica con `azure/webapps-deploy@v3` usando el publish profile del App Service.

Para habilitarlo:

```bash
# Descarga el publish profile del App Service
az webapp deployment list-publishing-profiles \
  -g $RG -n $APP --xml > publish-profile.xml

# Luego en GitHub: Settings → Secrets → Actions → New secret
# Name:  AZURE_WEBAPP_PUBLISH_PROFILE
# Value: contenido del publish-profile.xml
```

Cada push a `main` dispara un deploy. La URL pública es `https://<APP>.azurewebsites.net`. Para verificar:

```bash
curl https://<APP>.azurewebsites.net/health
```

### 5. Carga de archivos a Azure Blob Storage con SAS

Patrón: **el cliente sube directamente a Blob Storage**, no a la API. El backend sólo firma un SAS de escritura de corta duración. La API no proxea bytes, no hay límite por payload y el ancho de banda va directo al storage.

Setup de recursos:

```bash
az storage account create \
  -g $RG -n pruebastoracct -l $LOCATION --sku Standard_LRS

az storage container create \
  --account-name pruebastoracct -n uploads
```

En la API se añade un endpoint `POST /uploads/sas` protegido con JWT que:

1. Recibe `{ fileName, contentType }`.
2. Construye un `blobName` como `${userId}/${uuid()}-${fileName}`.
3. Firma un **SAS de escritura y creación** con `@azure/storage-blob`:

```ts
import {
  StorageSharedKeyCredential,
  BlobSASPermissions,
  generateBlobSASQueryParameters
} from "@azure/storage-blob";

const cred = new StorageSharedKeyCredential(
  env.azureStorage.account!,
  env.azureStorage.key!
);

const sas = generateBlobSASQueryParameters(
  {
    containerName: env.azureStorage.container,
    blobName,
    permissions: BlobSASPermissions.parse("cw"),    // create + write
    startsOn: new Date(Date.now() - 60 * 1000),     // 1 min de skew
    expiresOn: new Date(Date.now() + env.azureStorage.sasTtlMinutes * 60 * 1000),
    contentType
  },
  cred
).toString();

const url = `https://${env.azureStorage.account}.blob.core.windows.net/${env.azureStorage.container}/${blobName}?${sas}`;
```

4. El cliente hace `PUT $url` con cabecera `x-ms-blob-type: BlockBlob` y el binario. Sólo ese blob concreto es escribible, sólo durante la ventana.
5. Para descargas privadas se firma otro SAS con permiso `r` y TTL corto.

El paquete `@azure/storage-blob` ya está en `package.json`. Las variables `AZURE_STORAGE_ACCOUNT` / `AZURE_STORAGE_KEY` / `AZURE_STORAGE_CONTAINER` ya están parseadas en `env.ts` bajo `env.azureStorage`.

### 6. Checklist final

- [x] App Service Linux con Node 20 desplegado desde GitHub vía GitHub Actions.
- [x] URL pública HTTPS: `https://<APP>.azurewebsites.net`.
- [x] Variables de entorno configuradas (incluido `JWT_SECRET` y conexión a Azure SQL).
- [x] Base de datos gestionada: **Azure SQL Database** (driver `mssql` en TypeORM).
- [x] Estrategia de uploads vía SAS sobre Azure Blob Storage definida y dependencia instalada.
- [x] Logs en `App Service → Log stream`; métricas en `Monitor` / Application Insights.

---

## Resumen de la arquitectura en una frase

El dominio define **qué** se necesita mediante interfaces (puertos); los adaptadores de infraestructura dicen **cómo** se hace (CoinGecko, TypeORM, Express, JWT). `main.ts` es el único lugar donde se cablean y puede cambiar sin tocar el núcleo.
