# Multi-stage Dockerfile for Laravel on Alpine

# Build stage
FROM php:8.3-fpm-alpine AS build

# Install system dependencies and PHP extensions
RUN apk add --no-cache \
    bash \
    curl \
    git \
    unzip \
    sqlite \
    sqlite-dev \
    libzip-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    oniguruma-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo_sqlite \
        gd \
        zip \
        mbstring \
        opcache

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files
COPY composer.json composer.lock* ./

# Install dependencies (will be done after Laravel is created)
# RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Runtime stage
FROM php:8.3-fpm-alpine

# Install build dependencies and runtime dependencies
RUN apk add --no-cache \
    bash \
    curl \
    sqlite \
    sqlite-dev \
    libzip \
    libzip-dev \
    libpng \
    libpng-dev \
    libjpeg-turbo \
    libjpeg-turbo-dev \
    freetype \
    freetype-dev \
    oniguruma \
    oniguruma-dev \
    zlib-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo_sqlite \
        gd \
        zip \
        mbstring \
        opcache \
    && apk del --no-cache \
        libzip-dev \
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
        oniguruma-dev \
        zlib-dev

# Install Composer in runtime
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Configure PHP for production
RUN cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" && \
    echo "opcache.enable=1" >> "$PHP_INI_DIR/php.ini" && \
    echo "opcache.memory_consumption=128" >> "$PHP_INI_DIR/php.ini" && \
    echo "upload_max_filesize=10M" >> "$PHP_INI_DIR/php.ini" && \
    echo "post_max_size=10M" >> "$PHP_INI_DIR/php.ini"

# Set working directory
WORKDIR /var/www/html

# Create necessary directories
RUN mkdir -p storage/app/uploads storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache database

# Set permissions
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 775 storage bootstrap/cache

# Expose port 8000 for artisan serve
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
    CMD php -v || exit 1

# Start Laravel development server
CMD ["sh", "-c", "composer install && php artisan serve --host=0.0.0.0 --port=8000"]
