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
3. Persistencia con **TypeORM** (SQLite por defecto, PostgreSQL en Azure) usando *entities* y *repositories*.
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
| `DB_TYPE` | `sqlite` o `postgres` | `sqlite` |
| `DB_DATABASE` | Ruta SQLite o nombre de DB | `./data/app.db` |
| `JWT_SECRET` | Secreto para firmar JWT | (obligatorio en prod) |
| `JWT_EXPIRES_IN` | Expiración | `1h` |
| `COINGECKO_BASE_URL` | URL base de la API externa | `https://api.coingecko.com/api/v3` |

---

## Despliegue en Azure

### Arquitectura propuesta

```
GitHub (main) ──► Azure App Service (Node.js)
                         │
                         ├── Azure Database for PostgreSQL (flexible server)
                         └── Azure Blob Storage (para uploads, firmados con SAS)
```

### 1. Azure App Service

Crear un App Service Linux con runtime **Node 20**:

```bash
# Login y variables
az login
RG=prueba-backend-rg
APP=prueba-tecnica-api
LOCATION=westeurope

az group create -n $RG -l $LOCATION
az appservice plan create -g $RG -n ${APP}-plan --sku B1 --is-linux
az webapp create -g $RG -p ${APP}-plan -n $APP --runtime "NODE:20-lts"
```

### 2. Configurar variables de entorno (App Settings)

```bash
az webapp config appsettings set -g $RG -n $APP --settings \
  NODE_ENV=production \
  PORT=8080 \
  DB_TYPE=postgres \
  DB_HOST=prueba-db.postgres.database.azure.com \
  DB_PORT=5432 \
  DB_USERNAME=adminuser \
  DB_PASSWORD='<secreto>' \
  DB_DATABASE=appdb \
  DB_SSL=true \
  JWT_SECRET='<secreto-fuerte>' \
  JWT_EXPIRES_IN=1h \
  COINGECKO_BASE_URL=https://api.coingecko.com/api/v3 \
  COINGECKO_DEFAULT_VS_CURRENCY=usd
```

App Service inyecta estas variables al proceso. En `Configuration → Application settings` del portal aparecen como tal. Secretos (`JWT_SECRET`, `DB_PASSWORD`) deberían venir de **Azure Key Vault** referenciados con `@Microsoft.KeyVault(...)`.

### 3. Despliegue desde GitHub (CI/CD)

Opción A — desde el portal: **Deployment Center → GitHub → seleccionar repo/branch `main`**. Azure genera automáticamente un workflow en `.github/workflows/` que corre `npm ci && npm run build` y publica en App Service.

Opción B — por CLI:

```bash
az webapp deployment source config \
  -g $RG -n $APP \
  --repo-url https://github.com/<usuario>/Prueba_tecnica_backend \
  --branch main --manual-integration
```

En `package.json` ya está el script `build` y el `start` apunta a `dist/main.js`, que es lo que espera App Service. App Service define automáticamente `WEBSITE_NODE_DEFAULT_VERSION` y ejecuta `npm start`.

La aplicación queda accesible en `https://<APP>.azurewebsites.net` con HTTPS gestionado por Azure.

### 4. Base de datos: Azure Database for PostgreSQL

```bash
az postgres flexible-server create \
  -g $RG -n prueba-db \
  --admin-user adminuser --admin-password '<secreto>' \
  --sku-name Standard_B1ms --tier Burstable \
  --public-access 0.0.0.0  # permite App Service (ajustar a VNET en prod)

az postgres flexible-server db create -g $RG -s prueba-db -d appdb
```

`TypeORM` ya está configurado para usar PostgreSQL cuando `DB_TYPE=postgres`. `synchronize: true` es cómodo para la prueba; en producción real se migraría a `typeorm migration:run` en el paso de deploy.

### 5. Carga de archivos a Azure Storage con SAS

Aunque este proyecto no incluye aún un endpoint de uploads, el patrón recomendado es **no subir archivos a través de la API**: pedir al cliente que suba directamente a Blob Storage con un **SAS token** generado por el backend. Esto descarga la API y ahorra ancho de banda.

Flujo:

1. Crear cuenta y contenedor:
   ```bash
   az storage account create -g $RG -n pruebastoracct -l $LOCATION --sku Standard_LRS
   az storage container create --account-name pruebastoracct -n uploads
   ```
2. En la API se añadiría un endpoint `POST /uploads/sas` que:
   - Toma `fileName` y `contentType` del usuario autenticado.
   - Genera un **SAS de escritura** de corta duración (ej. 10 minutos) con `@azure/storage-blob`:
     ```ts
     const sas = generateBlobSASQueryParameters(
       {
         containerName: "uploads",
         blobName: `${userId}/${uuid()}-${fileName}`,
         permissions: BlobSASPermissions.parse("cw"),
         expiresOn: new Date(Date.now() + 10 * 60 * 1000),
         contentType
       },
       sharedKeyCredential
     ).toString();
     ```
   - Devuelve al cliente la URL `https://<cuenta>.blob.core.windows.net/uploads/<blob>?<sas>`.
3. El cliente hace `PUT` directo a esa URL con el binario del archivo. Al subir, sólo ese blob concreto es escribible durante la ventana.
4. Para descargas privadas se emite un **SAS de lectura** (`r`) con tiempo corto.

Variables en App Settings: `AZURE_STORAGE_ACCOUNT`, `AZURE_STORAGE_KEY` (o mejor `AZURE_STORAGE_CONNECTION_STRING` desde Key Vault), `AZURE_STORAGE_CONTAINER=uploads`.

### 6. Checklist final

- [x] App Service desplegado desde GitHub, accesible por URL pública HTTPS.
- [x] Variables de entorno configuradas (incluido `JWT_SECRET` y conexión a PostgreSQL).
- [x] Base de datos gestionada (Azure PostgreSQL Flexible Server).
- [x] Estrategia de uploads vía SAS sobre Azure Blob Storage definida.
- [x] Logs disponibles en `App Service → Log stream`; métricas básicas en `Monitor`.

---

## Resumen de la arquitectura en una frase

El dominio define **qué** se necesita mediante interfaces (puertos); los adaptadores de infraestructura dicen **cómo** se hace (CoinGecko, TypeORM, Express, JWT). `main.ts` es el único lugar donde se cablean y puede cambiar sin tocar el núcleo.
