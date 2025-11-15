# RIDE - Implementation Plan

## Overview
This implementation plan breaks down the Receipt & Invoice Data Extractor project into actionable steps, organized by phase and priority. Each task includes specific deliverables and technical details.

---

## Phase 1: Project Foundation & Docker Setup (Estimated: 1 hour)

### Task 1.1: Create Project Structure
**Priority:** Critical
**Estimated Time:** 15 minutes

**Steps:**
1. Create main project directory structure:
   ```
   RIDE/
   ├── backend/
   ├── frontend/
   ├── docker-compose.yml
   ├── .env.example
   └── README.md
   ```

2. Create `.gitignore` files for both backend and frontend

**Deliverables:**
- Root directory with proper folder structure
- Basic README with project description

---

### Task 1.2: Setup Docker Configuration
**Priority:** Critical
**Estimated Time:** 30 minutes

**Steps:**
1. Create `docker-compose.yml` in root directory with services:
   - `backend` (Laravel on Alpine PHP-FPM)
   - `frontend` (React with Nginx on Alpine)
   - Volume definitions for database and uploads
   - Network configuration

2. Create `.env.example` with all required environment variables

3. Add health checks for both services

**Deliverables:**
- `docker-compose.yml`
- `.env.example`
- Documentation for starting containers

**Technical Details:**
- Use `php:8.2-fpm-alpine` for backend
- Use `node:alpine` for frontend build
- Use `nginx:alpine` for frontend serving
- Configure volumes: `./backend/database`, `./backend/storage/app/uploads`

---

### Task 1.3: Initialize Laravel Backend
**Priority:** Critical
**Estimated Time:** 15 minutes

**Steps:**
1. Create `backend/Dockerfile` with multi-stage Alpine build
2. Install Laravel via Composer
3. Create `backend/.dockerignore`
4. Configure SQLite database connection
5. Set up CORS for React frontend

**Deliverables:**
- `backend/Dockerfile`
- Fresh Laravel installation
- Configured `.env` file
- `backend/.dockerignore`

**Technical Details:**
- Multi-stage build: build stage + runtime stage
- Install PHP extensions: pdo_sqlite, gd, zip, opcache
- Copy only necessary files to runtime image
- Set proper permissions for storage and cache directories

---

## Phase 2: Backend Core Development (Estimated: 5 hours)

### Task 2.1: Database Schema & Migrations
**Priority:** Critical
**Estimated Time:** 1 hour

**Steps:**
1. Create migration for `users` table (use Laravel's default)
2. Create migration for `receipts` table:
   - id (primary key)
   - user_id (foreign key)
   - file_path (string)
   - vendor (string, nullable)
   - date (datetime, nullable)
   - total (decimal, nullable)
   - tax (decimal, nullable)
   - status (enum: pending, processing, completed, failed)
   - raw_response (json, nullable)
   - created_at, updated_at

3. Create migration for `line_items` table:
   - id (primary key)
   - receipt_id (foreign key)
   - description (string)
   - quantity (decimal)
   - unit_price (decimal)
   - amount (decimal)
   - created_at, updated_at

4. Create migration for `extraction_logs` table:
   - id (primary key)
   - receipt_id (foreign key)
   - status (string)
   - error_message (text, nullable)
   - processing_time (integer, nullable)
   - created_at, updated_at

**Deliverables:**
- 4 migration files
- Eloquent models for Receipt, LineItem, ExtractionLog
- Model relationships configured

**Technical Details:**
- Add foreign key constraints with cascade delete
- Index user_id, status, and created_at columns
- Use soft deletes for receipts

---

### Task 2.2: Authentication System
**Priority:** Critical
**Estimated Time:** 1 hour

**Steps:**
1. Install Laravel Sanctum for API authentication
2. Create `AuthController` with:
   - `register()` method
   - `login()` method
   - `logout()` method
   - `user()` method (get current user)

3. Create API routes in `routes/api.php`:
   - POST `/api/v1/auth/register`
   - POST `/api/v1/auth/login`
   - POST `/api/v1/auth/logout`
   - GET `/api/v1/auth/user`

4. Add validation rules for registration and login
5. Configure Sanctum middleware

**Deliverables:**
- `app/Http/Controllers/Api/AuthController.php`
- Authentication routes
- Request validation classes
- Configured Sanctum

**Technical Details:**
- Return JSON responses with proper status codes
- Use bcrypt for password hashing
- Generate Sanctum tokens on login
- Validate email format and password strength

---

### Task 2.3: File Upload System
**Priority:** Critical
**Estimated Time:** 1 hour

**Steps:**
1. Create `ReceiptController` with `upload()` method
2. Implement file validation:
   - Allowed types: jpg, jpeg, png, pdf
   - Max size: 10MB
   - Image dimension validation

3. Create storage directory structure
4. Generate unique filenames with timestamps
5. Save file metadata to database with status='pending'

6. Create route: POST `/api/v1/receipts/upload`

**Deliverables:**
- `app/Http/Controllers/Api/ReceiptController.php`
- File upload validation
- Storage configuration
- Upload API endpoint

**Technical Details:**
- Store files in `storage/app/uploads/receipts/{user_id}/{year}/{month}/`
- Use UUID for filenames
- Create database record before processing
- Return receipt ID immediately after upload

---

### Task 2.4: Claude AI Integration
**Priority:** Critical
**Estimated Time:** 2 hours

**Steps:**
1. Install Anthropic PHP SDK or use Guzzle for API calls
2. Create `ClaudeService` class with:
   - `extractReceiptData(string $imagePath)` method
   - Error handling and retry logic
   - Response parsing

3. Create extraction prompt template
4. Implement image encoding (base64)
5. Parse JSON response from Claude
6. Update receipt status based on success/failure

7. Create queue job: `ProcessReceiptJob`
8. Dispatch job after file upload

**Deliverables:**
- `app/Services/ClaudeService.php`
- `app/Jobs/ProcessReceiptJob.php`
- Configured queue worker
- Extraction log creation

**Technical Details:**
```php
// Claude API request structure
{
  "model": "claude-sonnet-4-5",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "image",
          "source": {
            "type": "base64",
            "media_type": "image/jpeg",
            "data": "{base64_image}"
          }
        },
        {
          "type": "text",
          "text": "Extract receipt data as JSON..."
        }
      ]
    }
  ]
}
```

- Set timeout to 30 seconds
- Retry failed extractions up to 3 times
- Log all API calls to extraction_logs table
- Handle malformed JSON responses gracefully

---

### Task 2.5: Receipt Management API
**Priority:** Critical
**Estimated Time:** 1 hour

**Steps:**
1. Implement `ReceiptController` methods:
   - `index()` - List all receipts for authenticated user
   - `show($id)` - Get single receipt with line items
   - `update($id)` - Update receipt data
   - `destroy($id)` - Delete receipt

2. Create API routes:
   - GET `/api/v1/receipts` (with pagination, sorting, filtering)
   - GET `/api/v1/receipts/{id}`
   - PUT `/api/v1/receipts/{id}`
   - DELETE `/api/v1/receipts/{id}`

3. Add query filters: date range, vendor, status
4. Implement pagination (15 per page)
5. Add eager loading for line_items relationship

**Deliverables:**
- Complete ReceiptController CRUD methods
- API routes with middleware protection
- Receipt resource transformer
- Query filtering and pagination

**Technical Details:**
- Use Eloquent API Resources for consistent JSON responses
- Authorize user owns the receipt before update/delete
- Soft delete receipts (keep file for audit)
- Return 404 for non-existent receipts

---

### Task 2.6: Export Functionality
**Priority:** High
**Estimated Time:** 1 hour

**Steps:**
1. Install `maatwebsite/excel` package
2. Create `ExportController` with:
   - `exportCsv()` method
   - `exportExcel()` method

3. Create export classes:
   - `ReceiptsExport` for CSV
   - `ReceiptsExcelExport` for Excel with formatting

4. Add route: GET `/api/v1/receipts/export?format=csv|excel&date_from=&date_to=`

5. Implement query filtering for date range
6. Format data with proper headers

**Deliverables:**
- `app/Http/Controllers/Api/ExportController.php`
- `app/Exports/ReceiptsExport.php`
- `app/Exports/ReceiptsExcelExport.php`
- Export API endpoint

**Technical Details:**
- CSV columns: Date, Vendor, Item Description, Quantity, Unit Price, Amount, Tax, Total
- Excel: Multiple sheets (Summary + Line Items)
- Set proper headers for file download
- Stream large datasets to avoid memory issues
- Add totals row at the bottom

---

## Phase 3: Frontend Development (Estimated: 6 hours)

### Task 3.1: Initialize React Frontend
**Priority:** Critical
**Estimated Time:** 1 hour

**Steps:**
1. Create `frontend/Dockerfile` with multi-stage build:
   - Build stage: Node Alpine for npm build
   - Runtime stage: Nginx Alpine to serve static files

2. Initialize React app with Vite
3. Install dependencies:
   - react-router-dom
   - axios
   - react-dropzone
   - tailwindcss
   - lucide-react (icons)

4. Configure TailwindCSS
5. Create `frontend/.dockerignore`
6. Set up API client service with axios
7. Configure Nginx for SPA routing

**Deliverables:**
- `frontend/Dockerfile`
- React app initialized
- TailwindCSS configured
- API service setup
- `frontend/.dockerignore`
- Nginx configuration

**Technical Details:**
- Vite for fast development and building
- Axios baseURL from environment variable
- Axios interceptor for auth token
- Nginx try_files for client-side routing

---

### Task 3.2: Authentication UI
**Priority:** Critical
**Estimated Time:** 1 hour

**Steps:**
1. Create authentication context/hook for state management
2. Create pages:
   - `pages/Login.jsx`
   - `pages/Register.jsx`

3. Implement form validation
4. Handle API responses and errors
5. Store auth token in localStorage
6. Create protected route wrapper
7. Add loading states

**Deliverables:**
- `src/contexts/AuthContext.jsx`
- `src/pages/Login.jsx`
- `src/pages/Register.jsx`
- `src/components/ProtectedRoute.jsx`
- Login/register forms with validation

**Technical Details:**
- Use controlled form inputs
- Display error messages below fields
- Redirect to dashboard on successful login
- Store token and user data in context
- Clear auth data on logout

---

### Task 3.3: Upload Interface
**Priority:** Critical
**Estimated Time:** 1 hour

**Steps:**
1. Create `pages/Dashboard.jsx` with upload area
2. Create `components/FileUploader.jsx` using react-dropzone
3. Implement drag-and-drop functionality
4. Add file validation (client-side)
5. Show upload progress
6. Display success/error notifications
7. Show recent receipts list below upload area

**Deliverables:**
- `src/pages/Dashboard.jsx`
- `src/components/FileUploader.jsx`
- `src/components/UploadProgress.jsx`
- `src/components/Notification.jsx`
- Upload interface with feedback

**Technical Details:**
- Validate file type and size before upload
- Show thumbnail preview before upload
- Use FormData for file upload
- Display progress bar during upload
- Auto-refresh recent receipts after upload
- Show processing status for each receipt

---

### Task 3.4: Receipts List & Detail Views
**Priority:** Critical
**Estimated Time:** 2 hours

**Steps:**
1. Create `pages/Receipts.jsx` with:
   - Table view of all receipts
   - Search functionality
   - Filter by date range, vendor, status
   - Sort by date, vendor, amount
   - Pagination controls

2. Create `pages/ReceiptDetail.jsx` with:
   - Receipt header (vendor, date, total, tax)
   - Original image display
   - Line items table
   - Edit button for each field
   - Delete receipt button

3. Create components:
   - `components/ReceiptTable.jsx`
   - `components/ReceiptCard.jsx`
   - `components/LineItemsTable.jsx`
   - `components/SearchBar.jsx`
   - `components/FilterPanel.jsx`

**Deliverables:**
- `src/pages/Receipts.jsx`
- `src/pages/ReceiptDetail.jsx`
- Table and card components
- Search and filter functionality
- Pagination component

**Technical Details:**
- Debounce search input (300ms)
- Use query params for filters/pagination
- Lazy load receipt images
- Format currency values
- Format dates consistently
- Responsive table (cards on mobile)

---

### Task 3.5: Edit Functionality
**Priority:** High
**Estimated Time:** 1 hour

**Steps:**
1. Add inline editing to receipt detail view
2. Create edit mode toggle
3. Implement form validation
4. Add save/cancel buttons
5. Update line items inline
6. Show success/error messages

**Deliverables:**
- Inline edit functionality in ReceiptDetail
- `components/EditableField.jsx`
- Update API integration
- Validation and error handling

**Technical Details:**
- Toggle between view and edit mode
- Validate required fields
- Prevent saving invalid data
- Optimistic UI updates
- Revert on error

---

### Task 3.6: Export Interface
**Priority:** High
**Estimated Time:** 1 hour

**Steps:**
1. Create `pages/Export.jsx` with:
   - Date range picker
   - Format selector (CSV/Excel)
   - Export button
   - Download progress indicator

2. Create `components/DateRangePicker.jsx`
3. Implement export API call
4. Trigger file download
5. Show success message

**Deliverables:**
- `src/pages/Export.jsx`
- `src/components/DateRangePicker.jsx`
- Export functionality
- File download handling

**Technical Details:**
- Use HTML5 date inputs
- Validate date range (from <= to)
- Create blob from API response
- Use download attribute for file save
- Show loading state during export

---

## Phase 4: Integration & Testing (Estimated: 1 hour)

### Task 4.1: End-to-End Testing
**Priority:** High
**Estimated Time:** 30 minutes

**Steps:**
1. Test complete user flow:
   - Registration → Login
   - Upload receipt → View processing status
   - View receipt list → Open detail
   - Edit extracted data → Save
   - Export to CSV → Verify file
   - Export to Excel → Verify file

2. Test error scenarios:
   - Invalid file upload
   - Failed AI extraction
   - Invalid edit data
   - Network errors

3. Test across browsers (Chrome, Firefox, Safari)
4. Test mobile responsiveness

**Deliverables:**
- Test checklist completed
- Bug list documented
- Fixed critical bugs

---

### Task 4.2: Polish & Documentation
**Priority:** Medium
**Estimated Time:** 30 minutes

**Steps:**
1. Add loading spinners where missing
2. Improve error messages
3. Add empty states for lists
4. Update README with:
   - Setup instructions
   - Environment variables
   - Docker commands
   - API documentation

5. Add code comments where needed
6. Create `DEPLOYMENT.md` guide

**Deliverables:**
- Updated README.md
- DEPLOYMENT.md
- Improved UX polish
- Code documentation

---

## Implementation Checklist

### Backend Tasks
- [ ] Docker setup (backend Dockerfile, docker-compose)
- [ ] Laravel installation and configuration
- [ ] Database migrations (users, receipts, line_items, extraction_logs)
- [ ] Authentication API (register, login, logout)
- [ ] File upload endpoint
- [ ] Claude AI service integration
- [ ] Queue job for processing receipts
- [ ] Receipt CRUD API endpoints
- [ ] Export endpoints (CSV, Excel)
- [ ] API testing

### Frontend Tasks
- [ ] Docker setup (frontend Dockerfile, Nginx config)
- [ ] React app initialization with Vite
- [ ] TailwindCSS configuration
- [ ] API service setup
- [ ] Authentication UI (login, register)
- [ ] Protected routes
- [ ] Dashboard with upload interface
- [ ] Receipts list page
- [ ] Receipt detail page
- [ ] Inline edit functionality
- [ ] Export page
- [ ] Responsive design
- [ ] Error handling and notifications

### DevOps Tasks
- [ ] docker-compose.yml configuration
- [ ] Volume mounts for persistence
- [ ] Environment variables setup
- [ ] Health checks
- [ ] README documentation
- [ ] Deployment guide

### Testing Tasks
- [ ] Manual testing of all features
- [ ] Cross-browser testing
- [ ] Mobile responsiveness testing
- [ ] Error scenario testing
- [ ] Performance testing (large files, many receipts)

---

## Success Metrics

### Technical
- ✅ Application starts with `docker-compose up`
- ✅ All API endpoints respond correctly
- ✅ File uploads work (< 10MB images)
- ✅ Claude AI extracts data with >80% accuracy
- ✅ Data persists across container restarts
- ✅ Export generates valid CSV/Excel files

### User Experience
- ✅ Registration and login work seamlessly
- ✅ Upload provides clear feedback
- ✅ Processing status is visible
- ✅ Receipts list loads in < 2 seconds
- ✅ Edit functionality is intuitive
- ✅ Export downloads work in all browsers
- ✅ Mobile experience is functional

---

## Risk Mitigation

### Technical Risks
1. **Claude API Rate Limits**
   - Mitigation: Implement exponential backoff, queue system
   - Fallback: Manual entry mode

2. **Large File Processing**
   - Mitigation: Client-side validation, compression
   - Limit: 10MB max file size

3. **SQLite Concurrency**
   - Mitigation: Enable WAL mode
   - Acceptable for single-user MVP

4. **Container Storage**
   - Mitigation: Proper volume mounts
   - Backup strategy documented

### Timeline Risks
1. **Claude API Integration Complex**
   - Buffer: 30 minutes extra allocated
   - Simplify: Skip retry logic if needed

2. **Frontend Polish Takes Longer**
   - Priority: Core functionality over aesthetics
   - Defer: Advanced filters to post-MVP

---

## Post-MVP Enhancements (Priority Order)

1. **Advanced search/filtering** - 2 hours
2. **Receipt image zoom/preview** - 1 hour
3. **Bulk upload** - 2 hours
4. **Analytics dashboard** - 3 hours
5. **API documentation (Swagger)** - 1 hour
6. **Automated tests (Pest + React Testing Library)** - 4 hours
7. **Multi-user/team support** - 6 hours
8. **Accounting software integrations** - 8+ hours

---

## Quick Start Commands

```bash
# Setup
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY

# Build and start
docker-compose up --build

# Access
# Backend API: http://localhost:8000
# Frontend: http://localhost:3000

# Run migrations
docker-compose exec backend php artisan migrate

# Stop
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v
```

---

## Notes

- Keep commits small and focused
- Test after each major feature
- Use feature branches for larger changes
- Document environment variables as you add them
- Keep Docker images lean with Alpine base
- Monitor Claude API usage and costs
