# DevOps

Everything needed to run this store on a VPS with Docker. There are two
independent stacks, each with its own folder, compose file and entrypoint
script:

| Folder            | Stack                                   | Serves in the browser        |
| ----------------- | --------------------------------------- | ---------------------------- |
| `backend/`        | MySQL + Node/Express API (`port 5000`)  | `http://VPS:5000/health`     |
| `frontend/`       | Vite build served by nginx (`port 80`)  | `http://VPS/`                |

Both images are **built on the server** from the Dockerfiles in the repository
(`backend/Dockerfile`, `frontend/Dockerfile`). Nothing is pulled from a private
registry, so the only prerequisite on the VPS is Docker and a git clone of this
repository.

> These scripts target **Linux**. `status`, `logs` and `down` run anywhere, but
> `up` and `pull` expect a Linux `APP_DIR` (`/opt/store`) and `chmod`. On
> Windows use the app-level compose files (`backend/docker-compose.yml`,
> `frontend/docker-compose.yml`) for local testing instead. The two sets never
> share containers, volumes or networks, but they do bind the same host ports,
> so stop one before starting the other.

## Why the API is on its own address

The SPA builds every request as `${VITE_API_URL}/<route>` (`/auth/login`,
`/products`, `/cart`, ...) and the backend also owns `/products`, `/cart`,
`/admin` as *server* routes. If the API were served from the same origin, the
browser could not tell "open the products page" from "call the products API".
So the API lives on its own public URL (`VITE_API_URL`) and the backend's
`CORS_ORIGIN` allows the frontend origin. This is why both are configured in
`.env` and must be kept in sync.

## Layout

```
devops-scripts/
├── deploy.sh            orchestrator: runs both stacks in order
├── .env.example         shared settings (clone URL, branch, APP_DIR, DOMAIN)
├── lib/common.sh        helpers: secret generation, repo sync, health waits
├── backend/
│   ├── deploy.sh        up | down | restart | logs | status | pull | shell
│   ├── docker-compose.yml
│   └── .env.example
└── frontend/
    ├── deploy.sh        up | down | restart | logs | status | pull | shell
    ├── docker-compose.yml
    └── .env.example
```

## One-time setup on the VPS

```bash
# 1. prerequisites
sudo apt update && sudo apt install -y git
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER" && newgrp docker   # log out/in after this

# 2. get the code. Clone anywhere; deploy.sh moves it to APP_DIR itself.
sudo mkdir -p /opt && sudo chown "$USER" /opt
git clone https://github.com/amiraboubaker/store.git /tmp/store
cd /tmp/store/devops-scripts

# 3. point the scripts at the repository and tell them where to install it
cp .env.example .env
nano .env          # set REPO_URL, REPO_BRANCH and optionally DOMAIN

# 4. first run: creates backend/.env and frontend/.env with generated secrets
./deploy.sh init
nano backend/.env    # set CORS_ORIGIN to the frontend origin
nano frontend/.env   # set VITE_API_URL to the public backend URL

# 5. build and start everything
./deploy.sh up
```

`./deploy.sh status` prints the exact URLs to open.

## Day-to-day commands

```bash
./deploy.sh status     # container state + the URLs to open
./deploy.sh logs       # follow both stacks
./deploy.sh pull       # git pull + rebuild + recreate (backend first)
./deploy.sh restart    # restart without rebuilding
./deploy.sh down       # stop both (data volume is preserved)
./deploy.sh down --volumes   # stop and DELETE the database volume
```

Each stack also works on its own:

```bash
cd backend  && ./deploy.sh up && ./deploy.sh logs backend
cd frontend && ./deploy.sh up && ./deploy.sh status
```

`pull` is the command you need after changing any `VITE_*` value: those are
compiled into the JavaScript bundle, so a restart alone will not pick them up.

## Using `docker compose` directly

`deploy.sh` is a convenience wrapper. If you would rather drive Compose yourself,
run these commands from inside the cloned repository. Two things the wrapper
does for you have to be done by hand: it creates the external network, and it
generates the `.env` files.

```bash
cd /opt/store/devops-scripts

# 1. the shared network, ONCE per machine
docker network create store-net

# 2. the .env files, ONCE (or after a fresh clone)
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Then replace every `GENERATE` value in `backend/.env` with a real secret:

```bash
cd backend
sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=$(openssl rand -base64 24 | tr -d '\n=+/' | cut -c1-28)|" .env
sed -i "s|^DB_ROOT_PASSWORD=.*|DB_ROOT_PASSWORD=$(openssl rand -base64 24 | tr -d '\n=+/' | cut -c1-28)|" .env
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(openssl rand -hex 32)|" .env
sed -i "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$(openssl rand -hex 32)|" .env
sed -i "s|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=$(openssl rand -base64 24 | tr -d '\n=+/' | cut -c1-28)|" .env
chmod 600 .env

# verification: must print NOTHING
grep -E '^[A-Z_]+=GENERATE$' .env
cd ..
```

> Use that exact `grep -E '^[A-Z_]+=GENERATE$'`, not a plain `grep GENERATE .env`.
> The plain version also matches the `# ...replaces every GENERATE value...`
> comment in the header of `.env.example`, so it prints a comment line even
> when every secret is correctly set. The anchored pattern only matches real
> `KEY=GENERATE` assignments.

Edit `backend/.env` (`CORS_ORIGIN`) and `frontend/.env` (`VITE_API_URL`) to your
real origins, then start the stacks:

```bash
cd backend  && docker compose up -d --build
cd ../frontend && docker compose up -d --build
```

The two stacks are independent - the frontend only needs the backend's *URL*,
which is compiled into its bundle - so the order does not matter.

```bash
docker compose ps                 # state of this stack
docker compose logs -f            # follow logs
docker compose down               # stop (data volume kept)
docker compose down --volumes     # stop and delete the database
```

`docker compose up -d --build` builds from `../../backend/Dockerfile` and
`../../frontend/Dockerfile`, so it must be run from inside the repository.
After a `git pull`, run it again with `--build` to pick up code changes.

## How `up` works

1. Creates `.env` from `.env.example` on the first run and replaces every
   `GENERATE` value with a fresh secret (`openssl rand`).
2. Clones the repository into `APP_DIR` (default `/opt/store`), or fast-forwards
   the existing checkout to `REPO_BRANCH`. Your `.env` files are preserved.
3. Creates the shared external network `store-net`.
4. `docker compose up -d --build`, then waits for the containers to report healthy.

## Configuration that matters

**`backend/.env`**

| Variable           | Why                                                        |
| ------------------ | ---------------------------------------------------------- |
| `BACKEND_PORT`     | public API port, default `5000`                             |
| `CORS_ORIGIN`      | comma separated browser origins, e.g. `https://shop.tld`    |
| `DB_PASSWORD`, `DB_ROOT_PASSWORD` | generated on first run                    |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | generated on first run                     |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | bootstrap admin created on first start         |
| `DB_BIND_ADDRESS`  | stays `127.0.0.1`; never publish MySQL                     |
| `EMAIL_*`, `STRIPE_SECRET_KEY` | optional, blank disables the feature        |

**`frontend/.env`**

| Variable       | Why                                                             |
| -------------- | ---------------------------------------------------------------- |
| `VITE_API_URL` | public backend URL, e.g. `https://api.shop.tld` (needs a rebuild) |
| `FRONTEND_PORT`| public port, default `80`                                        |

## Changing the frontend URL without a rebuild

Not possible by design - `VITE_*` values are inlined into the bundle. Either
rebuild (`./deploy.sh pull`) or put a reverse proxy in front of the stack and
keep the API on a stable hostname.

## Putting a domain in front

The frontend container publishes port `80` directly, so the simplest setup is
pointing an `A` record at the VPS. If you need TLS, terminate it in a reverse
proxy (Caddy or nginx) on the host and proxy to `127.0.0.1:80` / `:5000`, then
set `FRONTEND_BIND_ADDRESS=127.0.0.1` and add the `https://` origins to
`CORS_ORIGIN` in `backend/.env`.

## Database

`./deploy.sh up` mounts `backend/sql/create_tables.sql` into MySQL's init
directory, so a **fresh volume** gets the full schema on first start. The
backend also runs `sequelize.sync({ alter: true })` on boot, so normal schema
changes are applied automatically. An existing volume is never re-initialised -
`./deploy.sh down --volumes` wipes it, and the next `up` recreates it empty.

Backups:

```bash
docker exec store-mysql sh -c 'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --all-databases' \
  > backup-$(date +%F).sql
```

## Security notes

- MySQL, the API and phpMyAdmin bind to `127.0.0.1`; they are reached through a
  reverse proxy that terminates TLS for `app.`, `api.` and `db.`. Without a
  proxy, set `BACKEND_BIND_ADDRESS` / `PHPADMIN_BIND_ADDRESS` to `0.0.0.0` to
  reach them directly on their ports.
- MySQL itself speaks its own protocol on 3306 and is never served over HTTP.
  The `db.` hostname publishes phpMyAdmin, the browser UI for that database.
  Native clients connect over `ssh -L 3306:127.0.0.1:3306`.
- All `.env` files are created with mode `600` and are gitignored.
- With the reverse proxy in place, only `22`, `80` and `443` need to be open in
  the firewall. `3306`, `5000` and `8081` stay bound to loopback and must not
  be exposed.
