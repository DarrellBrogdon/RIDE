# RIDE - Receipt & Invoice Data Extractor

A web application that uses AI to extract structured data from receipt and invoice images, storing the data in a database for viewing and export capabilities.

## Overview

RIDE (Receipt & Invoice Data Extractor) helps small businesses track expenses by automatically extracting key information from receipt and invoice images using Claude AI. Users can upload images, view extracted data, edit information, and export to CSV or Excel.

## Features

- **AI-Powered Extraction** - Automatic data extraction using Claude Vision API
- **User Authentication** - Secure registration and login
- **Receipt Management** - Upload, view, edit, and delete receipts
- **Line Item Details** - Detailed breakdown of each receipt
- **Export Functionality** - Download data in CSV or Excel format
- **Responsive Design** - Works on desktop and mobile devices
- **Docker Deployment** - Easy setup with Docker containers

## Tech Stack

- **Backend:** PHP 8.2 with Laravel 11
- **Frontend:** React 18 with TailwindCSS
- **Database:** SQLite
- **AI/ML:** Claude API (Anthropic)
- **Containerization:** Docker with Alpine-based images

## Prerequisites

- Docker Desktop installed and running
- Anthropic API key (get one at https://console.anthropic.com/)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RIDE
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

3. **Build and start the containers**
   ```bash
   docker-compose up --build
   ```

4. **Run database migrations**
   ```bash
   docker-compose exec backend php artisan migrate
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## Development

### Backend Development

```bash
# Access backend container
docker-compose exec backend sh

# Run migrations
docker-compose exec backend php artisan migrate

# Create a new migration
docker-compose exec backend php artisan make:migration create_table_name

# Run tests
docker-compose exec backend php artisan test
```

### Frontend Development

```bash
# Access frontend container
docker-compose exec frontend sh

# Install new package
docker-compose exec frontend npm install package-name
```

### Stop and Remove Containers

```bash
# Stop containers
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v
```

## Project Structure

```
RIDE/
├── backend/                 # Laravel application
│   ├── app/
│   │   ├── Http/Controllers/
│   │   ├── Models/
│   │   ├── Services/
│   │   └── Jobs/
│   ├── database/
│   │   └── migrations/
│   ├── routes/
│   │   └── api.php
│   ├── storage/
│   ├── Dockerfile
│   └── .dockerignore
│
├── frontend/               # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── contexts/
│   ├── public/
│   ├── Dockerfile
│   └── .dockerignore
│
├── docker-compose.yml      # Docker orchestration
├── .env.example           # Environment variables template
├── PROJECT_OUTLINE.md     # Project specifications
├── IMPLEMENTATION_PLAN.md # Development roadmap
└── README.md              # This file
```

## API Documentation

### Authentication Endpoints

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/user` - Get current user

### Receipt Endpoints

- `POST /api/v1/receipts/upload` - Upload receipt image
- `GET /api/v1/receipts` - List all receipts (paginated)
- `GET /api/v1/receipts/{id}` - Get single receipt with line items
- `PUT /api/v1/receipts/{id}` - Update receipt data
- `DELETE /api/v1/receipts/{id}` - Delete receipt
- `GET /api/v1/receipts/export` - Export receipts (CSV/Excel)

## Environment Variables

See `.env.example` for all available configuration options.

### Required Variables

- `ANTHROPIC_API_KEY` - Your Claude API key
- `APP_KEY` - Laravel application key (generated automatically)

### Optional Variables

- `APP_ENV` - Application environment (local, production)
- `APP_DEBUG` - Enable debug mode (true, false)
- `FRONTEND_URL` - Frontend URL for CORS
- `UPLOAD_MAX_SIZE` - Maximum upload file size

## Troubleshooting

### Containers won't start

```bash
# Check if ports are already in use
lsof -i :3000
lsof -i :8000

# Remove old containers and volumes
docker-compose down -v
docker-compose up --build
```

### Permission errors in containers

```bash
# Fix storage permissions
docker-compose exec backend chmod -R 775 storage bootstrap/cache
```

### Database not persisting

Ensure volumes are properly configured in `docker-compose.yml` and not being deleted between runs.

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For issues and questions, please create an issue in the repository.
