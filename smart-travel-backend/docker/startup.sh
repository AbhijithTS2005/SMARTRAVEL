#!/bin/sh
set -e

echo "=== Smart Travel Backend Startup ==="

# Wait for DB to be reachable (retry up to 30 times, 2s apart)
echo "Waiting for database connection..."
MAX_TRIES=30
COUNT=0
until php -r "
  \$host = getenv('DB_HOST');
  \$port = getenv('DB_PORT') ?: 3306;
  \$user = getenv('DB_USERNAME');
  \$pass = getenv('DB_PASSWORD');
  \$db   = getenv('DB_DATABASE');
  \$conn = @new mysqli(\$host, \$user, \$pass, \$db, \$port);
  if (\$conn->connect_error) { exit(1); }
  echo 'DB connected!' . PHP_EOL;
  exit(0);
" 2>/dev/null; do
  COUNT=$((COUNT + 1))
  if [ "$COUNT" -ge "$MAX_TRIES" ]; then
    echo "ERROR: Could not connect to database after $MAX_TRIES attempts."
    exit 1
  fi
  echo "  Attempt $COUNT/$MAX_TRIES - waiting 2s..."
  sleep 2
done

# Clear stale config cache before caching fresh one
echo "Clearing old cache..."
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true

# Run migrations
echo "Running migrations..."
php artisan migrate --force

# Cache for production performance
echo "Caching config, routes, views..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Create storage symlink
php artisan storage:link --force 2>/dev/null || true

# Start server
PORT="${PORT:-8080}"
echo "Starting server on port $PORT..."
exec php artisan serve --host=0.0.0.0 --port="$PORT"
