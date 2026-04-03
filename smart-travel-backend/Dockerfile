FROM php:8.3-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libgmp-dev \
    libzip-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd gmp zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /app

# Copy composer files first (for Docker cache optimization)
COPY composer.json composer.lock ./

# Install dependencies (no scripts to avoid artisan calls without env vars)
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

# Copy rest of application
COPY . .

# Generate autoload files only (no artisan commands - env vars not available at build)
RUN composer dump-autoload --optimize

# Create storage directories
RUN mkdir -p storage/logs \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    bootstrap/cache

# Set permissions
RUN chmod -R 775 storage bootstrap/cache

# Expose port (Railway sets PORT env var)
EXPOSE ${PORT:-8080}

# Start: run migrations + cache config, then serve
# These run at container start when env vars ARE available
CMD php artisan migrate --force && \
    php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache && \
    php artisan serve --host=0.0.0.0 --port=${PORT:-8080}
