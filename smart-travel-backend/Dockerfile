FROM php:8.3-cli

# Install system dependencies + mysqli for startup health check
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
    && docker-php-ext-install pdo_mysql mysqli mbstring exif pcntl bcmath gd gmp zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /app

# Copy composer files first (for Docker cache optimization)
COPY composer.json composer.lock ./

# Install dependencies (no scripts - env vars not available at build time)
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

# Copy application files
COPY . .

# Generate optimized autoload
RUN composer dump-autoload --optimize

# Create required storage directories
RUN mkdir -p storage/logs \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    bootstrap/cache

# Set permissions
RUN chmod -R 775 storage bootstrap/cache

# Copy and make startup script executable
RUN chmod +x docker/startup.sh

# Expose port (Render/Fly/Railway all set PORT env var)
EXPOSE 8080

# Use startup script (handles DB wait + migrations + serve)
CMD ["/bin/sh", "docker/startup.sh"]
