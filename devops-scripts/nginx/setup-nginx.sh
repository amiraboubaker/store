#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Provisions the host nginx reverse proxy + Let's Encrypt certificates for
# the three public subdomains:
#
#   https://rayesmodes.tn      -> frontend container   (127.0.0.1:FRONTEND_PORT)
#   https://api.rayesmodes.tn  -> backend API container  (127.0.0.1:BACKEND_PORT)
#   https://db.rayesmodes.tn   -> phpMyAdmin container   (127.0.0.1:PHPADMIN_PORT)
#
# Called by deploy.sh (up / proxy). Can also be run standalone:
#   sudo ./nginx/setup-nginx.sh
#
# Prerequisites on the host: root (sudo), apt, nginx + certbot installed
# (the script installs them if missing).
# ---------------------------------------------------------------------------

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../lib/common.sh
. "$SCRIPT_DIR/../lib/common.sh"

NGINX_DIR="$SCRIPT_DIR"
TEMPLATES_DIR="$NGINX_DIR"
SITES_AVAILABLE="/etc/nginx/sites-available"
SITES_ENABLED="/etc/nginx/sites-enabled"
WEBROOT="/var/www/letsencrypt"
LETSENCRYPT_DIR="/etc/letsencrypt"

# Load .env files so this script works standalone (not just via deploy.sh).
# Variables already in the environment are not overwritten by the sourced files.
_devops_dir="$(cd "$SCRIPT_DIR/.." && pwd)"
for _envfile in "$_devops_dir/.env" "$_devops_dir/backend/.env" "$_devops_dir/frontend/.env"; do
    [ -f "$_envfile" ] && { set -a; . "$_envfile"; set +a; }
done
unset _devops_dir _envfile

# --- helpers ----------------------------------------------------------------

ensure_root() {
    if [ "$(id -u)" -ne 0 ]; then
        die "this script must run as root (use sudo). The deploy.sh wrapper handles this."
    fi
}

ensure_packages() {
    local need=()
    command -v nginx   >/dev/null 2>&1 || need+=(nginx)
    command -v certbot >/dev/null 2>&1 || need+=(certbot)
    if [ "${#need[@]}" -gt 0 ]; then
        log "installing: ${need[*]}"
        apt-get update -qq
        apt-get install -y -qq "${need[@]}"
    fi
}

# substitute @@PLACEHOLDER@@ tokens in a template using env values already loaded
render_template() {
    local template="$1" output="$2"
    sed \
        -e "s|@@FRONTEND_DOMAIN@@|$FRONTEND_DOMAIN|g" \
        -e "s|@@API_DOMAIN@@|$API_DOMAIN|g" \
        -e "s|@@DB_DOMAIN@@|$DB_DOMAIN|g" \
        -e "s|@@FRONTEND_PORT@@|$FRONTEND_PORT|g" \
        -e "s|@@BACKEND_PORT@@|$BACKEND_PORT|g" \
        -e "s|@@PHPADMIN_PORT@@|$PHPADMIN_PORT|g" \
        "$template" >"$output"
}

install_configs() {
    mkdir -p "$SITES_AVAILABLE" "$SITES_ENABLED"

    # store.app  -> frontend
    render_template "$TEMPLATES_DIR/store.app.conf" \
        "$SITES_AVAILABLE/store.app"
    ln -sfn "$SITES_AVAILABLE/store.app" "$SITES_ENABLED/store.app"

    # store.api  -> backend API
    render_template "$TEMPLATES_DIR/store.api.conf" \
        "$SITES_AVAILABLE/store.api"
    ln -sfn "$SITES_AVAILABLE/store.api" "$SITES_ENABLED/store.api"

    # store.db   -> phpMyAdmin
    render_template "$TEMPLATES_DIR/store.db.conf" \
        "$SITES_AVAILABLE/store.db"
    ln -sfn "$SITES_AVAILABLE/store.db" "$SITES_ENABLED/store.db"

    # remove the default site that ships with nginx (clashes on port 80)
    rm -f "$SITES_ENABLED/default"

    ok "nginx site configs installed (store.app, store.api, store.db)"
}

obtain_certs() {
    # First run: the live cert files do not exist yet, so nginx will refuse to
    # start the HTTPS server blocks.  Create a throwaway self-signed cert so
    # nginx can start on port 80, serve the ACME challenge, then certbot
    # replaces the self-signed cert with a real one.
    local primary_domain="$FRONTEND_DOMAIN"
    if [ ! -d "$LETSENCRYPT_DIR/live/$primary_domain" ]; then
        log "creating placeholder self-signed cert for $primary_domain"
        mkdir -p "$LETSENCRYPT_DIR/live/$primary_domain"
        openssl req -x509 -nodes -days 1 -newkey rsa:2048 \
            -keyout "$LETSENCRYPT_DIR/live/$primary_domain/privkey.pem" \
            -out "$LETSENCRYPT_DIR/live/$primary_domain/fullchain.pem" \
            -subj "/CN=$primary_domain" \
            2>/dev/null || true
    fi

    # Ensure the SSL options snippet that our nginx configs `include` exists.
    # On Debian/Ubuntu this is created by the python3-certbot-nginx package;
    # on other systems we write a minimal modern config ourselves so nginx
    # never fails to reload.
    if [ ! -f "$LETSENCRYPT_DIR/options-ssl-nginx.conf" ]; then
        mkdir -p "$LETSENCRYPT_DIR"
        log "writing SSL options to $LETSENCRYPT_DIR/options-ssl-nginx.conf"
        cat > "$LETSENCRYPT_DIR/options-ssl-nginx.conf" <<'SSLCONF'
# These options are based on the Mozilla SSL Configuration Generator:
# https://ssl-config.mozilla.org/
ssl_session_cache shared:le_nginx_SSL:1m;
ssl_session_timeout 14h;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
SSLCONF
    fi
    if [ ! -f "$LETSENCRYPT_DIR/ssl-dhparams.pem" ]; then
        log "generating DH params (this may take a minute on first run)"
        openssl dhparam -out "$LETSENCRYPT_DIR/ssl-dhparams.pem" 2048 2>/dev/null || true
    fi

    # Ensure the ACME webroot exists and is readable by nginx
    mkdir -p "$WEBROOT/.well-known/acme-challenge"
    chmod -R 755 /var/www/letsencrypt

    # Test config before starting/reloading (placeholder certs + SSL options
    # must already be in place, which the steps above guarantee).
    if ! nginx -t 2>/dev/null; then
        warn "nginx config test failed - check /etc/nginx/sites-available/store.*"
        return 1
    fi
    if systemctl is-active --quiet nginx 2>/dev/null; then
        systemctl reload nginx
    else
        systemctl start nginx 2>/dev/null || nginx
    fi
    ok "nginx started, serving HTTP on port 80"

    # Obtain (or renew) certificates for all three domains.
    # A single certificate with SANs covers all subdomains.
    local domains=("$FRONTEND_DOMAIN" "www.$FRONTEND_DOMAIN" "$API_DOMAIN" "$DB_DOMAIN")
    local domain_args=()
    for d in "${domains[@]}"; do
        domain_args+=("-d" "$d")
    done

    if [ -z "${CERTBOT_EMAIL:-}" ]; then
        warn "CERTBOT_EMAIL is not set - using admin@$FRONTEND_DOMAIN"
        CERTBOT_EMAIL="admin@$FRONTEND_DOMAIN"
    fi

    log "requesting Let's Encrypt certificate for: ${domains[*]}"
    certbot certonly --webroot \
        --webroot-path "$WEBROOT" \
        --email "$CERTBOT_EMAIL" \
        --agree-tos \
        --no-eff-email \
        --quiet \
        "${domain_args[@]}"

    ok "certificates obtained for: ${domains[*]}"
}

setup_renewal() {
    # Auto-renewal: cron job runs certbot renew, reloads nginx on success
    local cron_entry="0 3 * * * certbot renew --quiet --post-hook 'nginx -s reload' 2>/dev/null || true"

    # Add to root crontab if not already present
    if ! crontab -l 2>/dev/null | grep -qF "certbot renew"; then
        (crontab -l 2>/dev/null; echo "$cron_entry") | crontab -
        ok "auto-renewal cron job installed (daily at 03:00)"
    else
        ok "auto-renewal cron job already present"
    fi
}

# --- main -------------------------------------------------------------------

main() {
    ensure_root
    ensure_packages

    # Required env values
    : "${FRONTEND_DOMAIN:?FRONTEND_DOMAIN is required in .env (use ./deploy.sh init)}"
    : "${API_DOMAIN:?API_DOMAIN is required in .env}"
    : "${DB_DOMAIN:?DB_DOMAIN is required in .env}"
    : "${FRONTEND_PORT:=3000}"
    : "${BACKEND_PORT:=5000}"
    : "${PHPADMIN_PORT:=8081}"

    head_ "installing nginx site configs"
    install_configs

    head_ "obtaining Let's Encrypt certificates"
    obtain_certs

    head_ "configuring auto-renewal"
    setup_renewal

    # Final reload so every HTTPS block picks up the real certificate
    nginx -t && { systemctl reload nginx 2>/dev/null || nginx 2>/dev/null || true; }

    head_ "Reverse proxy ready"
    printf '  Frontend ....... https://%s\n' "$FRONTEND_DOMAIN"
    printf '  Backend API .... https://%s\n' "$API_DOMAIN"
    printf '  Database (PM) .. https://%s\n' "$DB_DOMAIN"
    printf '  Admin (DB UI) ... https://%s\n' "$DB_DOMAIN"
    ok "all certificates secured with HTTPS"
}

main "$@"
