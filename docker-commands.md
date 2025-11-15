# Docker Commands Reference

## Quick Start

```bash
# First time setup
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Build and start all services
docker-compose up --build

# Start in detached mode (background)
docker-compose up -d --build
```

## Container Management

```bash
# Start containers
docker-compose up

# Stop containers
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v

# Restart specific service
docker-compose restart backend
docker-compose restart frontend

# View logs
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f queue-worker

# Check container status
docker-compose ps
```

## Backend Commands

```bash
# Access backend container shell
docker-compose exec backend sh

# Run migrations
docker-compose exec backend php artisan migrate

# Run migrations fresh (drops all tables)
docker-compose exec backend php artisan migrate:fresh

# Generate Laravel app key
docker-compose exec backend php artisan key:generate

# Clear caches
docker-compose exec backend php artisan cache:clear
docker-compose exec backend php artisan config:clear
docker-compose exec backend php artisan route:clear

# Create new migration
docker-compose exec backend php artisan make:migration create_table_name

# Create new controller
docker-compose exec backend php artisan make:controller ControllerName

# Create new model
docker-compose exec backend php artisan make:model ModelName

# Run tests
docker-compose exec backend php artisan test

# Install Composer packages
docker-compose exec backend composer install
docker-compose exec backend composer require package-name
docker-compose exec backend composer update

# View queue jobs
docker-compose exec backend php artisan queue:failed
docker-compose exec backend php artisan queue:retry all
```

## Frontend Commands

```bash
# Access frontend container shell
docker-compose exec frontend sh

# Install npm packages
docker-compose exec frontend npm install
docker-compose exec frontend npm install package-name

# Build for production
docker-compose exec frontend npm run build

# Run linter
docker-compose exec frontend npm run lint
```

## Database Commands

```bash
# Access SQLite database
docker-compose exec backend php artisan tinker

# Backup database
docker cp ride-backend:/var/www/html/database/database.sqlite ./backup.sqlite

# Restore database
docker cp ./backup.sqlite ride-backend:/var/www/html/database/database.sqlite
```

## Troubleshooting

```bash
# View all containers (including stopped)
docker ps -a

# Remove all stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Full cleanup (WARNING: removes all unused Docker resources)
docker system prune -a --volumes

# Check container resource usage
docker stats

# Inspect container
docker inspect ride-backend
docker inspect ride-frontend

# View container logs from start
docker logs ride-backend
docker logs ride-frontend

# Fix permission issues
docker-compose exec backend chmod -R 775 storage bootstrap/cache
docker-compose exec backend chown -R www-data:www-data storage bootstrap/cache
```

## Development Workflow

```bash
# 1. Start fresh
docker-compose down -v
docker-compose up --build -d

# 2. Setup database
docker-compose exec backend php artisan migrate

# 3. Watch logs
docker-compose logs -f

# 4. Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:8000

# 5. Make changes (auto-reload enabled)
# Edit files in ./backend or ./frontend

# 6. When done
docker-compose down
```

## Production Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production containers
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend php artisan migrate --force
```
