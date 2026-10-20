# DevOps

Everything needed to run this store on a VPS with Docker. There are two
independent application stacks plus a host-level nginx reverse proxy that
terminates TLS for three public subdomains:

| Folder             | Stack                                  | Container port(s)  | Public domain                    |
| ------------------ | -------------------------------------- | ------------------ | -------------------------------- |
| `backend/`         | MySQL + Node/Express API               | 3306 / 5000 / 8081 | `https://api.rayesmodes.tn` / `https://db.rayesmodes.tn` |
| `frontend/`        | Vite build served by nginx             | 80                 | `https://rayesmodes.tn`          |
| `nginx/`           | Host nginx + Let's Encrypt proxy       | 80 / 443           | TLS termination for all above    |

All three containerised stacks are built on the server from the Dockerfiles in
the repository (`backend/Dockerfile`, `frontend/Dockerfile`). The nginx reverse
proxy config is generated from the templates in `nginx/` and installed on the
host by `nginx/setup-nginx.sh`. The only prerequisites on the VPS are Docker,
`git`, and root access for the nginx/certbot step.

> These scripts target **Linux**. `status`, `logs` and `down` run anywhere, but
> `up`, `pull` and `proxy` expect a Linux `APP_DIR`. On Windows use the app-level
> compose files for local testing instead. The two compose sets never share
> containers, volumes or networks, but they do bind the same host ports, so stop
> one before starting the other.

## Why three domains?

The SPA builds every request as `${VITE_API_URL}/<route>` (`/auth/login`,
`/products`, `/cart`, ...) and the backend also owns `/products`, `/cart`,
`/admin` as *server* routes. If the API were served from the same origin as the
frontend, the browser could not tell "open the products page" from "call the
products API". So each surface gets its own domain:

- **`https://rayesmodes.tn`** — frontend SPA (Vite build in an nginx container)
- **`https://api.rayesmodes.tn`** — Express API (proxied to `127.0.0.1:5000`)
- **`https://db.rayesmodes.tn`** — phpMyAdmin UI for MySQL (proxied to `127.0.0.1:8081`)

The backend's `CORS_ORIGIN` allows the frontend origin, and `VITE_API_URL`
points at the API domain. Both are set in `.env` and must be kept in sync.

## Layout

```
devops-scripts/
├── deploy.sh            orchestrator: runs both stacks + nginx proxy in order
├── .env.example         shared settings (clone URL, branch, APP_DIR, domains, certbot email)
├── lib/
│   └── common.sh        helpers: secret generation, repo sync, health waits
├── backend/
│   ├── deploy.sh        up | down | restart | logs | status | pull | shell
│   ├── docker-compose.yml
│   └── .env.example     secrets + bind addresses (loopback behind proxy)
├── frontend/
│   ├── deploy.sh        up | down | restart | logs | status | pull | shell
│   ├── docker-compose.yml
│   └── .env.example     VITE_API_URL + bind address (loopback behind proxy)
└── nginx/
    ├── setup-nginx.sh   installs nginx configs + requests Let's Encrypt certs
    ├── store.app.conf   reverse proxy template -> frontend (rayesmodes.tn)
    ├── store.api.conf   reverse proxy template -> backend API (api.rayesmodes.tn)
    └── store.db.conf    reverse proxy template -> phpMyAdmin (db.rayesmodes.tn)
```

## One-time setup on the VPS

```bash
# 1. prerequisites
sudo apt update && sudo apt install -y git curl
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER" && newgrp docker   # log out/in after this

# 2. get the code. Clone anywhere; deploy.sh moves it to APP_DIR itself.
sudo mkdir -p /home/ubuntu/store && sudo chown "$USER" /home/ubuntu/store
git clone https://github.com/amiraboubaker/store.git /tmp/store
cd /tmp/store/devops-scripts

# 3. point the scripts at the repository and tell them where to install it
cp .env.example .env
nano .env      # set REPO_URL, REPO_BRANCH, FRONTEND_DOMAIN, API_DOMAIN, DB_DOMAIN

# 4. first run: creates backend/.env + frontend/.env with generated secrets
sudo ./deploy.sh init
nano backend/.env    # review CORS_ORIGIN (should be https://rayesmodes.tn)
nano frontend/.env   # review VITE_API_URL (should be https://api.rayesmodes.tn)

# 5. (as root) build containers and start everything, then configure nginx + certbot
sudo ./deploy.sh up
```

`./deploy.sh status` prints the exact URLs to open.

### DNS prerequisites

The three subdomains must resolve to the VPS IP **before** running certbot.
Point `A` records at the VPS:

| Record      | Points to     |
| ----------- | ------------- |
| `@`         | VPS IPv4      |
| `www`       | VPS IPv4      |
| `api`       | VPS IPv4      |
| `db`        | VPS IPv4      |

Certbot will fail with a DNS error if the domains do not resolve.

## Day-to-day commands

```bash
sudo ./deploy.sh status          # container state + the public URLs
sudo ./deploy.sh logs            # follow both stacks
sudo ./deploy.sh pull            # git pull + rebuild + recreate (backend first)
sudo ./deploy.sh proxy           # (re)configure nginx + renew certificates
sudo ./deploy.sh restart         # restart without rebuilding
sudo ./deploy.sh down            # stop both stacks (data volume preserved)
sudo ./deploy.sh down --volumes  # stop and DELETE the database volume
```

Each stack also works on its own:

```bash
cd backend  && ./deploy.sh up && ./deploy.sh logs backend
cd frontend && ./deploy.sh up && ./deploy.sh status
cd ../nginx && sudo ./setup-nginx.sh   # (re)configure proxy + certs
```

`pull` is the command you need after changing any `VITE_*` value: those are
compiled into the JavaScript bundle, so a restart alone will not pick them up.

## How `up` works (full stack)

1. Creates `.env` from `.env.example` on the first run and replaces every
   `GENERATE` value with a fresh secret (`openssl rand`).
2. Clones the repository into `APP_DIR` (default `/home/ubuntu/store`), or
   fast-forwards the existing checkout to `REPO_BRANCH`. `.env` files are
   preserved.
3. Creates the shared Docker network `store-net`.
4. Starts the backend stack (MySQL + API + phpMyAdmin), waits for health.
5. Starts the frontend stack (Vite build in nginx), waits for health.
6. Runs `nginx/setup-nginx.sh` which:
   - Installs nginx + certbot if missing
   - Renders and deploys `store.app`, `store.api`, `store.db` to
     `/etc/nginx/sites-available/` and symlinks them into `sites-enabled/`
   - Obtains Let's Encrypt certificates for all three domains
   - Installs a daily cron job for auto-renewal
   - Reloads nginx

## Nginx reverse proxy + certbot

The host nginx terminates TLS and proxies to the containers on loopback:

```
Internet (443)
    |
nginx + certbot /etc/letsencrypt/live/
    |
+--- https://rayesmodes.tn      -> 127.0.0.1:FRONTEND_PORT (3000)
+--- https://api.rayesmodes.tn  -> 127.0.0.1:BACKEND_PORT  (5000)
+--- https://db.rayesmodes.tn   -> 127.0.0.1:PHPADMIN_PORT (8081)
```

### What `nginx/setup-nginx.sh` does

1. **Installs packages** — `nginx` and `certbot` (with `python3-certbot-nginx`)
   if they are not already present.
2. **Renders templates** — replaces `@@DOMAIN@@` / `@@PORT@@` placeholders in
   `nginx/store.*.conf` using values from `.env`.
3. **Deploys site config** — writes to `/etc/nginx/sites-available/store.app`,
   `store.api`, `store.db` and symlinks each into `/etc/nginx/sites-enabled/`.
   The default site is removed to free port 80.
4. **Obtains certificates** — creates a temporary self-signed cert so nginx can
   start on port 80, then runs `certbot certonly --webroot` to request a real
   certificate covering all three domains. Renewed certs are stored under
   `/etc/letsencrypt/live/<domain>/`.
5. **Installs auto-renewal** — a root cron job runs `certbot renew` daily at 03:00
   and reloads nginx on success.

### Manual proxy management

```bash
sudo ./deploy.sh proxy               # full setup (install + certs + reload)
sudo ./nginx/setup-nginx.sh          # same, from inside the nginx/ folder
sudo certbot renew --dry-run         # test renewal
sudo nginx -t && sudo systemctl reload nginx   # test + reload after manual changes
```

## Using `docker compose` directly

`deploy.sh` is a convenience wrapper. If you would rather drive Compose yourself,
run these commands from inside the cloned repository. Two things the wrapper
does for you have to be done by hand: it creates the external network, and it
generates the `.env` files.

```bash
cd /home/ubuntu/store/devops-scripts

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
cd ../nginx && sudo ./setup-nginx.sh   # configure TLS
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

## Configuration that matters

### `devops-scripts/.env` (shared)

| Variable         | Why                                                        |
| ---------------- | ---------------------------------------------------------- |
| `APP_DIR`        | where the repo is cloned on the VPS (`/home/ubuntu/store`) |
| `REPO_URL`       | git remote to clone from                                   |
| `REPO_BRANCH`    | branch to check out (default `main`)                       |
| `FRONTEND_DOMAIN`| public frontend domain (default `rayesmodes.tn`)           |
| `API_DOMAIN`     | public backend API domain (default `api.rayesmodes.tn`)    |
| `DB_DOMAIN`      | public phpMyAdmin domain (default `db.rayesmodes.tn`)      |
| `CERTBOT_EMAIL`  | email registered with Let's Encrypt                        |
| `STORE_NETWORK`  | shared Docker network (default `store-net`)                |
| `TZ`             | host timezone (default `UTC`)                              |

### `devops-scripts/backend/.env`

| Variable           | Why                                                        |
| ------------------ | ---------------------------------------------------------- |
| `BACKEND_BIND_ADDRESS` | `127.0.0.1` (behind proxy; `0.0.0.0` for direct access) |
| `BACKEND_PORT`     | host port the proxy connects to, default `5000`             |
| `CORS_ORIGIN`      | comma separated browser origins, e.g. `https://rayesmodes.tn` |
| `DB_PASSWORD`, `DB_ROOT_PASSWORD` | generated on first run                        |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | generated on first run                     |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | bootstrap admin created on first start         |
| `DB_BIND_ADDRESS`  | stays `127.0.0.1`; never publish MySQL                     |
| `PHPADMIN_BIND_ADDRESS` | `127.0.0.1` (behind proxy)                            |
| `PHPADMIN_PORT`    | host port the proxy connects to, default `8081`            |
| `EMAIL_*`, `STRIPE_SECRET_KEY` | optional, blank disables the feature        |

### `devops-scripts/frontend/.env`

| Variable       | Why                                                             |
| -------------- | ---------------------------------------------------------------- |
| `VITE_API_URL` | public backend URL, e.g. `https://api.rayesmodes.tn` (rebuild needed) |
| `FRONTEND_BIND_ADDRESS` | `127.0.0.1` (behind proxy)                              |
| `FRONTEND_PORT`| host port the proxy connects to, default `3000`                  |

## Changing the frontend URL without a rebuild

Not possible by design - `VITE_*` values are inlined into the bundle. Either
rebuild (`./deploy.sh pull`) or put a reverse proxy in front of the stack and
keep the API on a stable hostname.

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
  reverse proxy that terminates TLS for `rayesmodes.tn`, `api.` and `db.`.
  Without a proxy, set `BACKEND_BIND_ADDRESS` / `PHPADMIN_BIND_ADDRESS` to `0.0.0.0`
  to reach them directly on their ports.
- MySQL itself speaks its own protocol on 3306 and is never served over HTTP.
  The `db.` hostname publishes phpMyAdmin, the browser UI for that database.
  Native clients connect over `ssh -L 3306:127.0.0.1:3306`.
- All `.env` files are created with mode `600` and are gitignored.
- With the reverse proxy in place, only `22`, `80` and `443` need to be open in
  the firewall. `3306`, `5000` and `8081` stay bound to loopback and must not
  be exposed.
- Let's Encrypt certificates auto-renew daily via cron; nginx is reloaded
  automatically after each successful renewal.
