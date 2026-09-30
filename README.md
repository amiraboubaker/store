# Couture E-Commerce Platform

A full-stack e-commerce platform for couture supplies, organized into a clean separated architecture.

## Tech Stack

- **Frontend:** React 18 + Vite + React Router, TypeScript, Tailwind CSS
- **Backend:** Node.js + Express.js, Sequelize ORM
- **Database:** MySQL (development) / SQLite (testing)
- **Media:** Uploaded product images stored in `backend/uploads`, static assets in `frontend/public/assets`

## Project Structure

```text
root/
├── frontend/              # React + Vite frontend application
│   ├── public/
│   │   └── assets/
│   │       ├── images/    # Static images (logos, banners, UI elements)
│   │       └── icons/     # Static icons and favicons
│   └── src/
│       ├── app/           # Reserved for future Next.js App Router migration
│       ├── pages/         # React Router page components
│       ├── components/    # Reusable UI components
│       ├── services/      # API client & external service adapters
│       ├── hooks/         # Custom React hooks
│       ├── context/       # React Context providers
│       ├── data/          # Static data, mock data
│       ├── utils/         # Helper functions
│       └── styles/        # Global styles, CSS modules
│   ├── .env.example       # Frontend environment variables
│   ├── vite.config.js     # Vite bundler configuration
│   └── package.json
│
├── backend/               # Express.js API server
│   ├── uploads/           # Dynamically uploaded product images
│   ├── public/            # Legacy admin panel static assets
│   ├── scripts/           # Utility & seed scripts
│   ├── sql/               # Database schema & migrations
│   └── src/
│       ├── index.js       # Server entry point
│       ├── controllers/   # Route handlers & business logic
│       ├── routes/        # API route definitions
│       ├── models/        # Sequelize ORM models
│       ├── services/      # Reusable business logic
│       ├── middleware/    # Auth, validation, error handling
│       ├── config/        # Configuration & env settings
│       ├── utils/         # Helper functions
│       └── tests/         # Backend unit & integration tests
│   ├── .env.example       # Backend environment variables
│   ├── database.sqlite    # SQLite test database (gitignored in production)
│   └── package.json
│
├── shared/                # Cross-cutting constants & types
│   ├── constants.ts       # Shared enums (categories, statuses, etc.)
│   └── types.ts           # Shared TypeScript interfaces
│
├── devops-scripts/         # VPS deployment stacks
│   ├── deploy.sh           # orchestrator for both stacks
│   ├── lib/common.sh       # shared shell helpers
│   ├── backend/            # VPS stack: mysql + backend
│   └── frontend/           # VPS stack: frontend
│
├── README.md
└── .gitignore
```

## Assets Handling

| Type | Location | Access |
|------|----------|--------|
| Static images | `frontend/public/assets/images/` | Served by Vite dev server / static file server |
| Product uploads | `backend/uploads/` | Exposed via `GET /uploads/:filename` backend static route |
| Database | Image URLs only (not binary files) | Frontend reads URLs from API responses |

### Asset Rules
- **Do not** store binary images directly in the database. Store only the relative path or URL.
- **Do not** duplicate assets. Reference them via URL.
- **Do not** hardcode paths. Use `VITE_API_URL` and environment configs.
- **Always** validate file types and sizes at upload time within `backend/src/middleware`.
- **In production**, replace `backend/uploads` with a CDN or object storage (S3, Cloudinary) and update `backend/src/config/storage.js` to abstract the provider.

## Environment Variables

Copy `.env.example` to `.env` in both `frontend/` and `backend/` and fill in real values.

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:3001
```

### Backend (`.env`)
```env
NODE_ENV=development
PORT=3001
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=store_user
DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD
DB_NAME=store
JWT_SECRET=CHANGE_ME_GENERATE_SECURE_SECRET
JWT_EXPIRATION=24h
# ... (see backend/.env.example for full list)
```

## Development Scripts

### Frontend
```bash
cd frontend
npm install
npm run dev      # Start Vite dev server on :5173
npm run build    # Build for production
npm run preview  # Preview production build
```

### Backend
```bash
cd backend
npm install
npm run dev      # Start Express with nodemon on :3001
npm run test     # Run Jest tests
```

## Docker

Each app owns its own `Dockerfile` and `docker-compose.yml`, and a `devops-scripts/`
folder holds the VPS deployment stacks. See **[devops-scripts/README.md](devops-scripts/README.md)**
for the full VPS walkthrough.

```text
backend/
├── Dockerfile              # node:20 + production deps, runs as `node` on :5000
└── docker-compose.yml      # local stack: mysql + phpmyadmin + backend
frontend/
├── Dockerfile              # multi-stage: vite build -> nginx:alpine on :80
├── nginx.conf              # SPA fallback, gzip, cache headers, /healthz
└── docker-compose.yml      # local stack: frontend only
devops-scripts/
├── deploy.sh               # runs both VPS stacks in order
├── backend/                # VPS stack: mysql + backend
└── frontend/               # VPS stack: frontend
```

### Local stacks

```bash
cd backend  && docker compose up -d --build   # API on :5000, phpMyAdmin on :8080
cd frontend && docker compose up -d --build   # site on :3000
```

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to
`frontend/.env` first. The backend compose file requires `DB_PASSWORD` and
`DB_ROOT_PASSWORD` to be set, and `DB_USER` must not be `root` (MySQL rejects
`MYSQL_USER=root`).

These local stacks use their own containers, volume and network, so they never
clash with the devops-scripts stacks. They do bind the same host ports, so stop
one before starting the other. Teardown:

```bash
cd backend  && docker compose down          # add -v to also drop the local db
cd frontend && docker compose down
```

### Native development (no Docker)

`backend/.env` is Docker-oriented (`DB_HOST=mysql`). For native runs, override
the database with SQLite in your shell — dotenv never overwrites variables that
are already exported:

```bash
# terminal 1 - backend on :5000 with SQLite
cd backend
$env:NODE_ENV="development"; $env:DB_DIALECT="sqlite"; $env:DB_HOST="sqlite"; npm run dev

# terminal 2 - vite dev server on :5173
cd frontend
npm run dev
```

`CORS_ORIGIN` in `backend/.env` must list `http://localhost:5173` for this to
work.

### Deploying to a VPS

The server only needs Docker and a clone of this repository. `deploy.sh` clones
or updates the code, generates secrets, builds both images locally and starts
the containers:

```bash
git clone https://github.com/amiraboubaker/store.git /tmp/store
cd /tmp/store/devops-scripts
cp .env.example .env          # set REPO_URL, REPO_BRANCH
./deploy.sh init              # creates backend/.env + frontend/.env with secrets
# set CORS_ORIGIN (backend) and VITE_API_URL (frontend) to your real origins
./deploy.sh up                # then open the URLs it prints
```

`./deploy.sh status | logs | pull | restart | down` manage the running stacks.

The API and the frontend are served from **different origins** on purpose. The
SPA calls `${VITE_API_URL}/products` while the backend also owns `/products` as a
server route, so serving both from one origin would make the two ambiguous.
`VITE_API_URL` (frontend) and `CORS_ORIGIN` (backend) must be kept in sync, and
changing `VITE_*` requires a rebuild since those values are inlined into the
bundle.

## Scaling Guidelines

1. **Keep separation:** Never import backend logic into frontend code or vice versa.
2. **Feature grouping:** Inside `frontend/src/pages`, group routes by feature (shop, admin, auth) using React Router nested routes.
3. **Backend versioning:** Prefix backend routes with `/api/v1/...` so future versions can coexist cleanly.
4. **Shared types:** Keep domain types in `shared/types` and import them into both apps to ensure contract consistency.
5. **Environment parity:** Keep `.env.example` files up to date and do not commit real secrets.
6. **Testing:** Add `__tests__` folders next to modules (`services/`, `controllers/`, `components/`) instead of a single global tests directory.
7. **Avoid deeply nested folders:** Keep feature modules at most 2 levels deep (e.g., `controllers/productController.js`, not `controllers/shop/product/brand/specificController.js`).
