#!/bin/sh
set -e

echo "==> SmartTravel Backend starting up..."

cd /var/www/html

# ── 1. Build a .env file from Render's injected environment variables ────────
# (Artisan commands need a .env file even when env vars are set externally)
cat > .env << EOF
APP_NAME="${APP_NAME:-Smart Travel API}"
APP_ENV="${APP_ENV:-production}"
APP_KEY="${APP_KEY:-}"
APP_DEBUG="${APP_DEBUG:-false}"
APP_URL="${APP_URL:-http://localhost}"

LOG_CHANNEL="${LOG_CHANNEL:-stderr}"
LOG_LEVEL="${LOG_LEVEL:-error}"

DB_CONNECTION="${DB_CONNECTION:-pgsql}"
DB_HOST="${DB_HOST:-}"
DB_PORT="${DB_PORT:-5432}"
DB_DATABASE="${DB_DATABASE:-}"
DB_USERNAME="${DB_USERNAME:-}"
DB_PASSWORD="${DB_PASSWORD:-}"

SESSION_DRIVER="${SESSION_DRIVER:-database}"
SESSION_LIFETIME=120
CACHE_STORE="${CACHE_STORE:-database}"
QUEUE_CONNECTION="${QUEUE_CONNECTION:-database}"
FILESYSTEM_DISK="${FILESYSTEM_DISK:-local}"

OPENWEATHER_API_KEY="${OPENWEATHER_API_KEY:-}"
OPENWEATHER_BASE_URL="${OPENWEATHER_BASE_URL:-https://api.openweathermap.org/data/3.0}"
PEXELS_API_KEY="${PEXELS_API_KEY:-}"
MAPILLARY_ACCESS_TOKEN="${MAPILLARY_ACCESS_TOKEN:-}"

VAPID_SUBJECT="${VAPID_SUBJECT:-}"
VAPID_PUBLIC_KEY="${VAPID_PUBLIC_KEY:-}"
VAPID_PRIVATE_KEY="${VAPID_PRIVATE_KEY:-}"
EOF

echo "==> .env file created from environment variables"

# ── 2. Generate APP_KEY if not provided ──────────────────────────────────────
if [ -z "$APP_KEY" ]; then
    echo "==> Generating APP_KEY..."
    php artisan key:generate --force
fi

# ── 3. Run database migrations ───────────────────────────────────────────────
echo "==> Running migrations..."
php artisan migrate --force

# ── 4. Seed the database if FORCE_SEED=true OR destinations table is empty ───
DEST_COUNT=$(php artisan tinker --execute="echo \App\Models\Destination::count();" 2>/dev/null | tail -1 || echo "0")
if [ "$FORCE_SEED" = "true" ] || [ "$DEST_COUNT" = "0" ] || [ -z "$DEST_COUNT" ]; then
    echo "==> Seeding database..."
    php artisan db:seed --force 2>/dev/null || echo "Seeder skipped — continuing"
fi

# ── 5. Cache config, routes, views ───────────────────────────────────────────
echo "==> Caching Laravel config, routes & views..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# ── 6. Permissions ───────────────────────────────────────────────────────────
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

# ── 7. Start Supervisor (Nginx + PHP-FPM) ────────────────────────────────────
mkdir -p /var/log/supervisor
echo "==> Starting Nginx + PHP-FPM via Supervisor..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
