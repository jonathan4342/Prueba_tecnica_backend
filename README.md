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


## Resumen de la arquitectura en una frase

El dominio define **qué** se necesita mediante interfaces (puertos); los adaptadores de infraestructura dicen **cómo** se hace (CoinGecko, TypeORM, Express, JWT). `main.ts` es el único lugar donde se cablean y puede cambiar sin tocar el núcleo.
