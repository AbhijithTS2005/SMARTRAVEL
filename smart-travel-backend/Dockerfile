FROM php:8.3-apache

# Install system dependencies and PHP extensions
RUN apt-get update && apt-get install -y \
        libpng-dev \
        libonig-dev \
        libxml2-dev \
        libzip-dev \
        libpq-dev \
        libgmp-dev \
        zip unzip git curl \
    && docker-php-ext-install \
        pdo_mysql pdo_pgsql pgsql \
        mbstring exif pcntl bcmath gd gmp zip opcache \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy composer files first (layer cache optimisation)
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

# Copy the rest of the application
COPY . .

# Generate optimised autoloader
RUN composer dump-autoload --optimize

# ── Apache configuration ─────────────────────────────────────────────────────
# Change Apache to listen on port 8080 (Render requirement)
RUN sed -i 's/Listen 80$/Listen 8080/' /etc/apache2/ports.conf

# Replace default site with our custom VirtualHost config
COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf
RUN sed -i 's/\r//' /etc/apache2/sites-available/000-default.conf

# ── PHP opcache tuning ───────────────────────────────────────────────────────
COPY docker/opcache.ini /usr/local/etc/php/conf.d/opcache.ini

# ── Storage permissions ──────────────────────────────────────────────────────
RUN mkdir -p storage/logs \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# ── Entrypoint ───────────────────────────────────────────────────────────────
COPY docker/entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r//' /entrypoint.sh && chmod +x /entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
