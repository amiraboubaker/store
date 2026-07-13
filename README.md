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
├── docker/
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── docker-compose.yml
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

```bash
docker compose up --build
```

Services:
- Frontend: `:3000`
- Backend: `:3001`
- MySQL: `:3306`

## Scaling Guidelines

1. **Keep separation:** Never import backend logic into frontend code or vice versa.
2. **Feature grouping:** Inside `frontend/src/pages`, group routes by feature (shop, admin, auth) using React Router nested routes.
3. **Backend versioning:** Prefix backend routes with `/api/v1/...` so future versions can coexist cleanly.
4. **Shared types:** Keep domain types in `shared/types` and import them into both apps to ensure contract consistency.
5. **Environment parity:** Keep `.env.example` files up to date and do not commit real secrets.
6. **Testing:** Add `__tests__` folders next to modules (`services/`, `controllers/`, `components/`) instead of a single global tests directory.
7. **Avoid deeply nested folders:** Keep feature modules at most 2 levels deep (e.g., `controllers/productController.js`, not `controllers/shop/product/brand/specificController.js`).
