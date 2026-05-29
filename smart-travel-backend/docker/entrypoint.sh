#!/bin/sh
set -e

echo "==> SmartTravel Backend starting up..."

cd /var/www/html

# ── 1. Generate APP_KEY if not set ──────────────────────────────────────────
if [ -z "$APP_KEY" ]; then
    echo "==> Generating APP_KEY..."
    php artisan key:generate --force
fi

# ── 2. Clear cached config (env vars may have changed) ──────────────────────
php artisan config:clear

# ── 3. Run database migrations ───────────────────────────────────────────────
echo "==> Running migrations..."
php artisan migrate --force

# ── 4. Seed the database if it's empty (first deploy only) ──────────────────
DEST_COUNT=$(php artisan tinker --execute="echo App\Models\Destination::count();" 2>/dev/null | tail -1 || echo "0")
if [ "$DEST_COUNT" = "0" ] || [ -z "$DEST_COUNT" ]; then
    echo "==> Seeding database (first deploy)..."
    php artisan db:seed --force 2>/dev/null || echo "Seeder skipped or failed — continuing"
fi

# ── 5. Cache config, routes, views for production performance ────────────────
echo "==> Caching Laravel config, routes & views..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# ── 6. Ensure storage permissions ────────────────────────────────────────────
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

# ── 7. Create supervisor log dir ─────────────────────────────────────────────
mkdir -p /var/log/supervisor

echo "==> Starting Nginx + PHP-FPM via Supervisor..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
