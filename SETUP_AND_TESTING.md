# RIDE - Receipt & Invoice Data Extractor
## Setup and Testing Guide

This guide will walk you through setting up and testing the complete RIDE application.

---

## Prerequisites

- Docker and Docker Compose installed
- Claude API key from Anthropic
- At least 4GB of available RAM

---

## Initial Setup

### 1. Environment Configuration

#### Backend Configuration

Navigate to the backend directory and create your `.env` file:

```bash
cd backend
cp .env.example .env
```

Edit the `.env` file and configure:

```env
# Application
APP_NAME="Receipt Extractor"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database (SQLite)
DB_CONNECTION=sqlite
DB_DATABASE=/app/database/database.sqlite

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Claude API
CLAUDE_API_KEY=your_actual_api_key_here
CLAUDE_API_URL=https://api.anthropic.com/v1/messages

# Queue
QUEUE_CONNECTION=database

# File Upload
UPLOAD_MAX_SIZE=10
```

**Important**: Replace `your_actual_api_key_here` with your actual Claude API key from Anthropic.

#### Frontend Configuration

Navigate to the frontend directory and create your `.env` file:

```bash
cd ../frontend
cp .env.example .env
```

The default configuration should work:

```env
VITE_API_URL=http://localhost:8000
```

---

## Starting the Application

### 1. Build and Start Services

From the project root directory:

```bash
# Build all containers
docker-compose build

# Start all services
docker-compose up -d
```

This will start three services:
- **backend**: Laravel API (port 8000)
- **queue-worker**: Laravel queue processor for async receipt processing
- **frontend**: React app (port 3000)

### 2. Initialize Backend

Run these commands to set up the Laravel backend:

```bash
# Enter the backend container
docker-compose exec backend sh

# Generate application key
php artisan key:generate

# Create database file
touch database/database.sqlite

# Run migrations
php artisan migrate

# Exit container
exit
```

### 3. Verify Services

Check that all services are running:

```bash
docker-compose ps
```

You should see:
- `ride-backend-1` - running on port 8000
- `ride-queue-worker-1` - running
- `ride-frontend-1` - running on port 3000

---

## Testing the Application

### Phase 1: User Registration and Authentication

1. **Open the application**: Navigate to `http://localhost:3000`

2. **Register a new account**:
   - Click "Create account" or navigate to `/register`
   - Fill in:
     - Full name
     - Email address
     - Password (minimum 8 characters)
     - Confirm password
   - Click "Create account"
   - You should be automatically logged in and redirected to the Dashboard

3. **Test logout**:
   - Click the "Logout" button in the top right
   - Verify you're redirected to the login page

4. **Test login**:
   - Enter your email and password
   - Click "Sign in"
   - Verify you're redirected to the Dashboard

### Phase 2: Receipt Upload and Processing

1. **Upload a receipt**:
   - From the Dashboard, locate the "Upload Receipt" section
   - Either drag and drop a receipt image (JPG/PNG/PDF) or click to browse
   - Maximum file size: 10MB
   - Watch the upload progress bar
   - You should see:
     - "Uploaded successfully - Processing..." message
     - The receipt appears in "Recent Receipts" with status "pending" or "processing"

2. **Monitor processing**:
   - The queue worker will process the receipt in the background
   - Check the backend logs: `docker-compose logs -f queue-worker`
   - Processing typically takes 5-15 seconds depending on image complexity
   - Refresh the Dashboard to see status updates

3. **Verify extraction results**:
   - Once status changes to "completed", click on the receipt
   - Verify extracted data:
     - Vendor name
     - Transaction date
     - Total amount
     - Tax amount
     - Line items (if applicable)

### Phase 3: Receipt Management

1. **View all receipts**:
   - Click "All Receipts" in the navigation
   - Verify the receipts list displays correctly
   - Test pagination if you have more than 10 receipts

2. **Search functionality**:
   - Enter a vendor name in the search box
   - Verify results update after typing (500ms debounce)
   - Clear the search and verify all receipts return

3. **Filter by status**:
   - Select different status options from the dropdown
   - Verify only matching receipts are shown
   - Select "All Status" to clear filter

4. **Sorting**:
   - Test sorting options:
     - Date (Newest/Oldest)
     - Vendor (A-Z/Z-A)
     - Amount (High-Low/Low-High)
   - Click table headers to sort on desktop view
   - Verify sort order updates correctly

5. **View receipt details**:
   - Click on any receipt
   - Verify:
     - All receipt information displays correctly
     - Line items table shows (if available)
     - Original receipt image displays
     - Download original button works

### Phase 4: Edit Functionality

1. **Edit a receipt**:
   - From receipt detail page, click "Edit"
   - Verify all fields are pre-populated
   - Make changes:
     - Update vendor name
     - Change date
     - Modify amounts
     - Add/remove line items
     - Change status
   - Click "Save Changes"
   - Verify you're redirected back to detail view with updated data

2. **Test line items management**:
   - Click "Edit" on a receipt
   - Click "Add Item" to add a new line item
   - Fill in:
     - Description
     - Quantity
     - Unit Price
   - Verify total price calculates automatically
   - Remove an item using the trash icon
   - Click "Recalculate Total from Line Items"
   - Verify receipt total updates based on line items + tax

3. **Test validation**:
   - Try to save with empty vendor - should show error
   - Try to save with empty date - should show error
   - Verify all required fields are validated

### Phase 5: Export Functionality

1. **Navigate to Export page**:
   - Click "Export" in the navigation

2. **Test CSV export**:
   - Select "CSV" format
   - Click "All Time" preset
   - Select "Completed Only" status
   - Click "Export to CSV"
   - Verify file downloads with correct filename
   - Open CSV file and verify data format

3. **Test Excel export**:
   - Select "Excel" format
   - Test date range presets:
     - Today
     - This Week
     - This Month
     - Last Month
     - This Year
   - Click "Export to Excel"
   - Open Excel file and verify:
     - Two sheets: "Summary" and "Line Items"
     - Summary sheet has receipt headers
     - Line Items sheet has detailed breakdown
     - Proper formatting and totals

4. **Test custom date range**:
   - Select custom "From" and "To" dates
   - Verify validation (From must be before To)
   - Export and verify only receipts in range are included

### Phase 6: Delete Functionality

1. **Delete a receipt**:
   - Navigate to receipt detail page
   - Click "Delete" button
   - Verify confirmation modal appears
   - Click "Cancel" - modal should close
   - Click "Delete" again, then confirm
   - Verify:
     - Redirected to receipts list
     - Receipt no longer appears
     - File is removed from storage

---

## Common Issues and Solutions

### Issue: Queue worker not processing receipts

**Symptoms**: Receipts stay in "pending" status

**Solution**:
```bash
# Check queue worker logs
docker-compose logs queue-worker

# Restart queue worker
docker-compose restart queue-worker

# Process queue manually
docker-compose exec backend php artisan queue:work --once
```

### Issue: Claude API errors

**Symptoms**: Receipts marked as "failed"

**Solution**:
1. Verify Claude API key is correct in `.env`
2. Check you have available credits in your Anthropic account
3. Review extraction logs in the database or backend logs
4. Try re-processing by editing the receipt and changing status to "pending"

### Issue: File upload fails

**Symptoms**: Upload progress stops or shows error

**Solution**:
1. Check file size (must be under 10MB)
2. Verify file format (JPG, PNG, or PDF only)
3. Check backend storage permissions:
   ```bash
   docker-compose exec backend sh
   chmod -R 775 storage bootstrap/cache
   chown -R www-data:www-data storage bootstrap/cache
   ```

### Issue: Database errors

**Symptoms**: 500 errors, migration failures

**Solution**:
```bash
# Reset database
docker-compose exec backend sh
rm database/database.sqlite
touch database/database.sqlite
php artisan migrate:fresh
exit
```

### Issue: CORS errors in browser console

**Symptoms**: Network requests blocked by CORS policy

**Solution**:
1. Verify `CORS_ALLOWED_ORIGINS` in backend `.env` includes `http://localhost:3000`
2. Restart backend: `docker-compose restart backend`

### Issue: Frontend not connecting to backend

**Symptoms**: API errors, authentication fails

**Solution**:
1. Verify backend is running: `docker-compose ps`
2. Check `VITE_API_URL` in frontend `.env` is `http://localhost:8000`
3. Restart frontend: `docker-compose restart frontend`

---

## Performance Testing

### Load Testing Receipts

1. **Upload multiple receipts simultaneously**:
   - Upload 5-10 receipts at once
   - Verify queue worker processes them sequentially
   - Monitor system resources: `docker stats`

2. **Large file handling**:
   - Upload files close to 10MB limit
   - Verify upload progress tracking works
   - Confirm processing completes successfully

3. **Export large datasets**:
   - Create 50+ receipts (can use test data)
   - Export all receipts to Excel
   - Verify export completes and file opens correctly

---

## API Testing with cURL

### Authentication

**Register**:
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }'
```

**Login**:
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the returned token for subsequent requests.

### Receipts

**List receipts**:
```bash
curl -X GET "http://localhost:8000/api/v1/receipts?per_page=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Upload receipt**:
```bash
curl -X POST http://localhost:8000/api/v1/receipts/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@/path/to/receipt.jpg"
```

**Get receipt details**:
```bash
curl -X GET http://localhost:8000/api/v1/receipts/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Update receipt**:
```bash
curl -X PUT http://localhost:8000/api/v1/receipts/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "vendor": "Updated Vendor",
    "date": "2024-01-15",
    "total": 99.99,
    "tax": 9.99,
    "status": "completed"
  }'
```

**Delete receipt**:
```bash
curl -X DELETE http://localhost:8000/api/v1/receipts/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Export receipts**:
```bash
curl -X GET "http://localhost:8000/api/v1/receipts/export?format=csv" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  --output receipts.csv
```

---

## Development Commands

### Backend

```bash
# Enter backend container
docker-compose exec backend sh

# Run migrations
php artisan migrate

# Create a new migration
php artisan make:migration create_something_table

# Clear cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# View routes
php artisan route:list

# Run tinker (REPL)
php artisan tinker

# Process queue manually
php artisan queue:work

# View logs
tail -f storage/logs/laravel.log
```

### Frontend

```bash
# Enter frontend container
docker-compose exec frontend sh

# Install new dependency
npm install package-name

# View build output
npm run build
```

### Database

```bash
# Access SQLite database
docker-compose exec backend sh
sqlite3 database/database.sqlite

# Common SQLite commands
.tables                          # List tables
.schema receipts                 # Show table schema
SELECT * FROM receipts LIMIT 10; # Query data
.exit                           # Exit SQLite
```

---

## Success Criteria Checklist

Complete application testing should verify:

- [ ] User can register and login successfully
- [ ] User can upload receipt images (JPG, PNG, PDF)
- [ ] Queue worker processes receipts and extracts data using Claude API
- [ ] Extracted data displays correctly (vendor, date, total, tax, line items)
- [ ] User can view list of all receipts with pagination
- [ ] Search by vendor name works correctly
- [ ] Filter by status works correctly
- [ ] Sorting by date, vendor, and amount works correctly
- [ ] Receipt detail page shows all information and original image
- [ ] User can edit receipt data and line items
- [ ] Line item totals calculate correctly
- [ ] User can delete receipts
- [ ] Export to CSV works with filters
- [ ] Export to Excel creates multi-sheet workbook
- [ ] Date range filtering works in export
- [ ] Navigation between all pages works correctly
- [ ] Logout works and redirects to login
- [ ] Protected routes redirect unauthenticated users
- [ ] File size and type validation works
- [ ] Error messages display appropriately
- [ ] Loading states show during async operations

---

## Monitoring and Logs

### View all logs
```bash
docker-compose logs -f
```

### View specific service logs
```bash
docker-compose logs -f backend
docker-compose logs -f queue-worker
docker-compose logs -f frontend
```

### View Laravel logs
```bash
docker-compose exec backend tail -f storage/logs/laravel.log
```

---

## Stopping the Application

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (warning: deletes all data)
docker-compose down -v
```

---

## Next Steps

After successful testing, consider:

1. **Production deployment**: Update environment variables for production
2. **Backup strategy**: Implement database backup routine
3. **Monitoring**: Add application monitoring (e.g., Sentry, New Relic)
4. **Performance optimization**: Enable caching, optimize images
5. **Security hardening**: Enable rate limiting, add CSP headers
6. **User documentation**: Create end-user guide
7. **Additional features**: Batch upload, receipt categories, reporting dashboard
