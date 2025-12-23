# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Asset Handover Management System for Ajman University - a full-stack web application that manages asset assignments to employees with automated PDF generation, email notifications, digital signatures, automated reminders, and admin notifications.

## Architecture

### Frontend (React + Vite)
- **Entry**: `src/main.jsx` → `src/App.jsx`
- **Routing**: React Router with protected routes:
  - `/login` - Public login page (Employee ID + OTP)
  - `/dashboard` - Dashboard (all authenticated users)
  - `/assets` - Asset management (admin, staff)
  - `/handover` - Create new assignments (admin, staff)
  - `/assignments` - View and manage assignments (all authenticated users)
  - `/users` - User management (admin only)
  - `/sign/:token` - Public signing page (no auth required)
- **State**: Local component state + AuthContext for authentication
- **Styling**: CSS-in-JS with global styles in `src/index.css`
- **Components**: Reusable components in `src/components/`
- **Auth**: `AuthContext` provides `useAuth` hook with `authFetch` helper

### Backend (Node.js + Express)
- **Server**: `server/index.js` - Express server on port 3001
- **Database**: SQLite with better-sqlite3, initialized in `server/database.js`
- **Routes**: Modular route files in `server/routes/`
- **Services**:
  - PDF generation (`pdfGenerator.js`)
  - Email handling (`emailService.js`)
  - Automated reminders (`reminderService.js`)
  - Structured logging (`logger.js`)
  - Error tracking (`sentry.js`)
  - OTP management (`otpService.js`)
  - Token management (`tokenService.js`)
- **Middleware**:
  - Request logging (`middleware/requestLogger.js`)
  - Error handling (`middleware/errorHandler.js`)
  - Authentication (`middleware/auth.js`)
  - Validation (`middleware/validation.js`)
- **Migrations**: Database schema updates in `server/migrations/`

### Observability Stack
- **Logging**: Pino (structured JSON logging)
  - Pretty-print in development, JSON in production
  - Module-specific child loggers
  - Sensitive data redaction
- **Error Tracking**: Sentry (optional, production)
  - Automatic exception capture
  - Request context included
- **Health Checks**: `/api/health/*`
  - Basic: `/api/health`
  - Detailed: `/api/health/detailed` (DB, memory, config status)
  - Kubernetes probes: `/api/health/live`, `/api/health/ready`

### Security Stack
- **Headers**: Helmet (CSP, HSTS, XSS protection, etc.)
- **Validation**: express-validator on all mutation routes
- **CSRF Protection**: Content-Type + Origin validation
- **Middleware**: `middleware/security.js`, `middleware/validation.js`, `middleware/csrf.js`

### Authentication System (Phase 5.1)
- **Login Method**: Employee ID + 6-digit OTP (no passwords)
- **Token Strategy**: JWT access tokens (15 min) + refresh tokens (7 days, httpOnly cookie)
- **Roles**: Admin (full access), Staff (manage assets), Viewer (read-only)
- **Services**:
  - `server/services/otpService.js` - OTP generation, validation, rate limiting
  - `server/services/tokenService.js` - JWT and refresh token management
- **Middleware**:
  - `authenticateToken` - Validates JWT access token
  - `requireRole(...roles)` - Checks user has required role
  - `requireAdmin` - Shorthand for admin-only routes
  - `requireStaff` - Shorthand for staff/admin routes
- **Frontend**:
  - `src/contexts/AuthContext.jsx` - Auth state, `useAuth` hook
  - `src/components/ProtectedRoute.jsx` - Route protection wrapper
  - `authFetch` helper - Automatic token refresh on 401

### Database Schema

#### Core Tables
- **`assets`**: 20+ fields including:
  - `asset_code` (unique), `asset_type`, `description`, `model`, `serial_number`
  - Hierarchical categories (1-4)
  - Hierarchical locations (1-4)
  - `status`, `unit_cost`, `warranty_start_date`
  - `supplier_vendor`, `manufacturer`, `lpo_voucher_no`, `invoice_no`

- **`employees`**:
  - `employee_name`, `employee_id`, `email`, `office_college`

- **`asset_assignments`**: Assignment tracking with extensive fields:
  - Basic: `employee_id`, `assigned_at`, `pdf_sent`
  - Employee details: `employee_name`, `employee_id_number`, `email`, `office_college`, `backup_email`
  - Signature: `signature_token`, `signature_data`, `signature_date`, `is_signed`, `signed_by_email`
  - Location: `location_building`, `location_floor`, `location_section`, `device_type`
  - Dispute: `is_disputed`, `dispute_reason`
  - Token: `token_expires_at` (30 days)
  - Reminders: `last_reminder_sent`, `reminder_count`

- **`assignment_items`**: Many-to-many relationship between assignments and assets

#### Authentication Tables (Phase 5.1)
- **`users`**: User accounts linked to employees
  - `employee_id` (FK to employees), `role` (admin/staff/viewer), `is_active`
  - `created_at`, `created_by`, `updated_at`, `last_login_at`

- **`otp_codes`**: One-time passwords for login
  - `user_id`, `code`, `expires_at`, `used`, `created_at`, `ip_address`

- **`refresh_tokens`**: JWT refresh tokens (hashed)
  - `user_id`, `token_hash`, `expires_at`, `revoked`, `created_at`

- **`otp_rate_limits`**: Rate limiting for OTP requests
  - `identifier`, `request_count`, `window_start`

### Key Features

#### Phase 1-2 Features
1. **Asset Management**: Full CRUD operations with extensive field support
2. **Employee Management**: Track employee information
3. **Excel Import**: Bulk import assets from .xls/.xlsx files
4. **Handover Process**: Select multiple assets, assign to employee, auto-generate PDF, send email
5. **Digital Signature**: Public signing page with canvas signature capture
6. **PDF Generation**: Dynamic table that includes LPO column only if assets have LPO numbers
7. **Email Service**: Uses Ethereal (dev) or configurable SMTP (production)
8. **Multi-Theme System**: 8 professional color themes with instant switching and localStorage persistence

#### Phase 3 Features (December 2025)
9. **Automated Reminders**: Weekly email reminders for unsigned assignments
   - Runs daily at 9 AM (configurable)
   - Sends reminder every 7 days (max 4 reminders)
   - Stops when signed, disputed, or expired
   - Color-coded urgency (red when ≤3 days remaining)

10. **Edit Assets in Assignments**: Modify assigned assets for unsigned assignments
    - Add/remove assets via modal interface
    - Real-time search functionality
    - Optional email notification
    - Preserves original signing token

11. **Admin Notifications**:
    - Receives copy of signed PDFs automatically
    - Receives dispute alerts with asset details
    - Configurable via `ADMIN_EMAIL` env variable

12. **Backup Email Support**: Secondary signer for employee unavailability
    - Optional backup email field
    - Separate email with backup signer context
    - Tracks who actually signed (primary vs backup)

13. **Resend Email**: Admin can resend signing links for unsigned assignments

#### Phase 5.1 Features (December 2025)
14. **OTP-Based Authentication**: Login via Employee ID + 6-digit OTP
    - No passwords required
    - OTP sent to employee email
    - Rate limiting (20 dev / 5 prod per 15 min)

15. **JWT + Refresh Token System**:
    - Access tokens (15 min expiry)
    - Refresh tokens (7 day, httpOnly cookie)
    - Automatic token refresh on 401

16. **Role-Based Access Control**:
    - Admin: Full access to all features
    - Staff: Manage assets and assignments
    - Viewer: Read-only access to dashboard and assignments

17. **User Management** (Admin only):
    - Create users by linking employees
    - Update roles, activate/deactivate users
    - View unlinked employees

### Theme System
- **Location**: `src/themes.js` (theme definitions), `src/components/ThemeSwitcher.jsx` (UI component)
- **Architecture**: Uses CSS custom properties (CSS variables) for dynamic theming
- **Themes Available**: 8 themes including Ajman Blue, AU Official Brand, Emerald Green, Royal Purple, Sunset Orange, Ocean Teal, Crimson Red, Midnight Black
- **Persistence**: User's theme choice saved to localStorage and restored on app load
- **Integration**: Theme initialized in `src/App.jsx`, switcher button in header
- **Styling**: All theme-dependent colors in `src/index.css` use `var(--theme-*)` variables

### Automated Reminder Service
- **Location**: `server/services/reminderService.js`
- **Scheduler**: Uses node-cron for scheduled execution
- **Configuration**:
  - `REMINDER_CRON_SCHEDULE` - Cron pattern (default: `0 9 * * *` = 9 AM daily)
  - `TZ` - Timezone (default: `Asia/Dubai`)
  - `BASE_URL` - Used in signing links
- **Logic**:
  - Queries for unsigned, undisputed, non-expired assignments
  - Checks if 7+ days since last reminder (or never sent)
  - Maximum 4 reminders per assignment
  - Updates `last_reminder_sent` and `reminder_count`
- **Manual Trigger**: `POST /api/reminders/trigger` endpoint for testing

## Development Commands

### Start Development
```bash
npm run dev
```
Runs both frontend (port 3000) and backend (port 3001) with hot reload

### Run Only Frontend
```bash
npm run dev:client
```

### Run Only Backend
```bash
npm run dev:server
```

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Run Database Migrations
```bash
node server/migrations/001_add_signature_fields.js
node server/migrations/002_fix_signature_token.js
node server/migrations/003_add_location_options.js
node server/migrations/004_add_backup_email.js
node server/migrations/005_add_transfer_fields.js
node server/migrations/006_add_auth_tables.js
node server/migrations/007_add_otp_failed_attempts.js
```

### Create Initial Admin User
```bash
# List available employees
node server/seeds/createAdmin.js

# Create admin from employee ID
node server/seeds/createAdmin.js 1
```

## Important Implementation Details

### PDF Generation
- Located in `server/services/pdfGenerator.js`
- Uses PDFKit to create formatted documents
- **Dynamic column rendering**: LPO column only appears if at least one asset has `lpo_voucher_no` set
- Includes AU declaration text, employee info, asset table, and signature field
- Embeds signature image when available
- Handles pagination for large asset lists

### Email Service
- Located in `server/services/emailService.js`
- Development mode: Uses Ethereal test accounts (preview URLs logged to console)
- Production mode: Configured via environment variables (SMTP_HOST, SMTP_USER, etc.)
- **Multiple Email Types**:
  1. Initial signing link (primary email)
  2. Backup signer email (if backup_email provided)
  3. Signed PDF to employee
  4. Signed PDF to admin (if ADMIN_EMAIL configured)
  5. Dispute notification to admin
  6. Reminder emails (every 7 days, max 4)
  7. Resend signing link
  8. OTP login code (Phase 5.1)
  9. Transfer notifications (Phase 4.5)
- **Email Parameters**: Function accepts destructured object with many optional parameters:
  - `email`, `employeeName`, `employeeId`, `primaryEmail`, `employeeEmail`
  - `officeCollege`, `signingUrl`, `expiresAt`, `assetCount`, `signatureDate`
  - `assignmentId`, `assets`, `disputeReason`, `pdfBuffer`
  - `isPrimary`, `isAdminCopy`, `isDispute`, `isReminder`
  - `reminderNumber`, `daysRemaining`

### API Proxy
- Vite dev server proxies `/api/*` requests to Express backend (configured in `vite.config.js`)
- Frontend makes relative API calls (e.g., `fetch('/api/assets')`)

### Database Initialization
- Database auto-creates on first server start
- Located at `server/assets.db` (gitignored)
- Uses synchronous better-sqlite3 for simplicity and performance
- Migrations must be run manually if database already exists

## API Endpoints

### Assets
- `GET /api/assets` - Get all assets
- `GET /api/assets/:id` - Get single asset
- `POST /api/assets` - Create new asset
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get single employee
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Handover & Assignments
- `POST /api/handover` - Create assignment and send handover email
- `GET /api/handover/assignments` - Get all assignments
- `GET /api/handover/assignments/:id` - Get assignment details
- `PUT /api/handover/assignments/:id/assets` - Edit assets in assignment
- `POST /api/handover/resend/:id` - Resend signing email
- `DELETE /api/handover/assignments/:id` - Delete assignment

### Public Signing Endpoints (no auth)
- `GET /api/handover/sign/:token` - Get assignment by signing token
- `POST /api/handover/submit-signature/:token` - Submit signature
- `POST /api/handover/dispute/:token` - Submit dispute

### Reminders
- `POST /api/reminders/trigger` - Manually trigger reminder check

### Authentication (Phase 5.1)
- `POST /api/auth/request-otp` - Request OTP for login (public)
- `POST /api/auth/verify-otp` - Verify OTP and get tokens (public)
- `POST /api/auth/refresh` - Refresh access token (uses cookie)
- `POST /api/auth/logout` - Logout current session (requires auth)
- `POST /api/auth/logout-all` - Logout all devices (requires auth)
- `GET /api/auth/me` - Get current user info (requires auth)

### User Management (Admin only, Phase 5.1)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create user (link employee)
- `PUT /api/users/:id` - Update user role/status
- `DELETE /api/users/:id` - Deactivate user
- `PUT /api/users/:id/reactivate` - Reactivate user
- `GET /api/users/available/employees` - Get unlinked employees

## Common Development Tasks

### Adding New Asset Fields
1. Create migration file in `server/migrations/`
2. Add ALTER TABLE statement
3. Update POST/PUT routes in `server/routes/assets.js`
4. Add form fields in `src/components/AssetForm.jsx`
5. Update display in `src/components/AssetList.jsx` if needed

### Modifying PDF Layout
Edit `server/services/pdfGenerator.js`:
- Adjust `colWidths` array for column sizing
- Modify `colPositions` calculation for spacing
- Update table header text and row rendering logic
- Signature image positioning in `addSignature()` function

### Adding New Email Templates
Edit `server/services/emailService.js`:
1. Add new conditional block (e.g., `if (isNewType)`)
2. Set `subject`, `textContent`, `htmlContent`
3. Use template literals with provided parameters
4. Follow existing email styling patterns
5. Update function signature if new parameters needed

### Adding New Routes
1. Create route file in `server/routes/`
2. Import and use in `server/index.js`
3. Create corresponding React page in `src/pages/`
4. Add route in `src/App.jsx`
5. Add navigation button in `src/components/Header.jsx`

### Adding a New Theme
1. Open `src/themes.js`
2. Add new theme object to `themes` export with all color properties
3. Theme automatically appears in ThemeSwitcher dropdown
4. All CSS using `var(--theme-*)` variables will use new theme colors
5. See theme definitions in `src/themes.js` for color properties

### Modifying Reminder Logic
Edit `server/services/reminderService.js`:
- `sendReminders()` - Main reminder logic
- Query conditions for which assignments need reminders
- Email content and parameter passing
- Database update logic (last_reminder_sent, reminder_count)

### Adding Modal Components
Follow pattern in `src/components/EditAssetsModal.jsx`:
- Accept `onClose` and `onSuccess` callbacks as props
- Use modal overlay pattern for full-screen modals
- Implement loading states
- Handle form submission with async/await
- Display success/error messages via parent component

## Testing Features

### Testing Email in Development
When running in dev mode without SMTP config:
1. Send a handover email through the UI
2. Check server console for "Preview URL: https://ethereal.email/message/..."
3. Open the URL to view the sent email with PDF attachment

### Testing Reminder Service
```bash
# Method 1: Manual trigger via API
curl -X POST http://localhost:3001/api/reminders/trigger

# Method 2: Modify cron schedule to run more frequently
# In .env: REMINDER_CRON_SCHEDULE=*/5 * * * *  (every 5 minutes)

# Method 3: Check logs during server startup
npm run dev:server
# Look for: [Reminder Service] Initializing with schedule...
```

### Testing Edit Assets
1. Create an assignment (don't sign it)
2. Go to Assignments page
3. Click "Edit Assets" button (should be visible)
4. Add/remove assets
5. Toggle "Send updated email notification"
6. Save and verify changes

### Testing Signature Workflow
1. Create assignment with assets
2. Copy signing link from email preview URL
3. Open link in browser (works without login)
4. Draw signature, fill optional location fields
5. Click "Sign Acknowledgement"
6. Check both employee and admin receive signed PDFs

## Automated Testing

### Test Commands
```bash
# Run all tests (unit + integration)
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run E2E tests (requires browser)
npm run playwright:install  # First time only
npm run test:e2e

# E2E with visual UI
npm run test:e2e:ui
```

### Test Structure
```
tests/
├── setup/
│   ├── globalSetup.js    # Global test initialization
│   ├── testSetup.js      # Database initialization
│   └── testApp.js        # Test Express app factory
├── fixtures/
│   └── testData.js       # Shared test data
├── unit/
│   └── validation.test.js  # Validation middleware tests
├── integration/
│   ├── assets.test.js    # Assets API tests
│   └── employees.test.js # Employees API tests
└── e2e/
    ├── navigation.spec.js  # Navigation tests
    └── assets.spec.js      # Asset management tests
```

### Writing Tests

#### Unit Tests
Test pure logic (validation, utilities):
```javascript
import { describe, it, expect } from 'vitest';

describe('Validation', () => {
  it('should validate email format', () => {
    // Test logic here
  });
});
```

#### Integration Tests
Test API endpoints with database:
```javascript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, cleanupTestDb, closeTestDb } from '../setup/testApp.js';

describe('Assets API', () => {
  let app, db;

  beforeAll(async () => {
    const result = await createTestApp();
    app = result.app;
    db = result.db;
  });

  afterAll(() => closeTestDb(db));
  beforeEach(() => cleanupTestDb(db));

  it('should create asset', async () => {
    const response = await request(app)
      .post('/api/assets')
      .send({ asset_code: 'TEST-001', asset_type: 'Laptop' })
      .expect(201);

    expect(response.body.asset_code).toBe('TEST-001');
  });
});
```

#### E2E Tests
Test full user workflows:
```javascript
import { test, expect } from '@playwright/test';

test('should create new asset', async ({ page }) => {
  await page.goto('/assets');
  await page.getByRole('button', { name: /add/i }).click();
  await page.getByLabel(/asset code/i).fill('TEST-001');
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByText('TEST-001')).toBeVisible();
});
```

## Environment Configuration

Create `.env` file (copy from `.env.example`):

### Required for Production
```env
# SMTP Email Configuration
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-password
EMAIL_FROM="Ajman University Asset Management <assets@ajman.ac.ae>"

# Admin Email (receives signed PDFs and dispute notifications)
ADMIN_EMAIL=store@ajman.ac.ae

# Base URL (used in signing links)
BASE_URL=https://yourdomain.com

# JWT Secrets (REQUIRED - generate secure random strings!)
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
```

### Optional Configuration
```env
# Server Port
PORT=3001

# Reminder Service
REMINDER_CRON_SCHEDULE=0 9 * * *  # Daily at 9 AM
TZ=Asia/Dubai                      # Timezone
```

### Development
- Leave SMTP settings empty to use Ethereal (test email service)
- BASE_URL defaults to http://localhost:3000
- PORT defaults to 3001

## Known Patterns

### Database Operations
- Uses prepared statements for all queries
- No transactions (consider adding for multi-step operations)
- All dates stored as TEXT in ISO format
- Use `.get()` for single row, `.all()` for multiple rows
- Use `.run()` for INSERT/UPDATE/DELETE

### Error Handling
- Backend: Try-catch blocks with 500 status on errors
- Frontend: Sets message state `{type: 'error'|'success', text: string}`
- Unique constraint violations handled specifically (asset_code)
- 403 for forbidden operations (edit signed/disputed assignments)
- 404 for not found resources
- 400 for validation errors

### Form Validation
- Required fields marked with asterisk in UI
- Backend validates required fields before database operations
- Email validation via HTML5 input type="email"
- Frontend prevents invalid submissions (e.g., empty asset list)

### Async Operations
- All email sending is async (doesn't block API responses)
- Use `await` for database operations and email sending
- Reminder service runs in background via cron
- Frontend uses async/await for all API calls

## Dependencies Note

### Package Versions
This project uses the latest stable versions as of December 2024:
- **React 19**: Latest React with improved performance
- **Express 5**: Latest Express.js version
- **better-sqlite3 12.x**: Latest version compatible with Node.js 24+
- **Vite 6**: Latest build tool
- **PDFKit 0.16**: Latest PDF generation library
- **Nodemailer 7**: Latest email library (secure version)
- **node-cron 4**: Latest cron scheduler
- **react-signature-canvas 1.x**: Canvas-based signature capture

### Native Compilation
- `better-sqlite3`: Requires Python and build tools on first install
- Minimum Node.js version: 20.x (tested with Node.js 24.x)
- `pdfkit`: Pure JavaScript, no native dependencies

### Node.js Compatibility
**Important**: If npm install fails with compilation errors for `better-sqlite3`:
1. This is usually due to Node.js version incompatibility
2. Ensure you're using Node.js 20.x or later
3. The package.json already specifies `better-sqlite3` v12.x which supports Node.js 24+
4. If issues persist, try: `rm -rf node_modules package-lock.json && npm install`

## Security Considerations

### Token-Based Access
- Signing pages use unique tokens (nanoid with 32 characters)
- Tokens expire after 30 days
- Token validation on every public endpoint access
- No authentication system yet (planned for future phases)

### Input Validation
- Backend validates all required fields
- SQL injection prevented via prepared statements
- Email addresses validated before sending
- Asset IDs validated as non-empty arrays

### Access Control
- Signed assignments cannot be edited (403 error)
- Disputed assignments cannot be edited (403 error)
- Public endpoints only accessible with valid token
- Admin emails configurable via environment variable (not hardcoded)

## Troubleshooting

### Reminder Service Not Running
1. Check server logs for initialization message
2. Verify node-cron is installed: `npm list node-cron`
3. Check cron schedule syntax in .env
4. Test manual trigger: `POST /api/reminders/trigger`

### Emails Not Sending
1. Check server console for Ethereal preview URLs (dev mode)
2. Verify SMTP credentials in .env (production)
3. Check email service logs for errors
4. Test with Ethereal first before production SMTP

### Database Locked Errors
1. Close all database connections
2. Remove `server/assets.db-wal` and `server/assets.db-shm` files
3. Restart server
4. Consider adding connection pooling for high concurrency

### PDF Not Generating
1. Check PDFKit version compatibility
2. Verify asset data is being fetched correctly
3. Check for missing required fields
4. Review server logs for PDFKit errors

## Project Status

**Current Phase:** Phase 5.2 Complete (December 2025)
**Technical Debt:** Observability, Security Hardening, Testing Infrastructure - Complete

### Completed Phases
- **Phase 1-4**: Asset management, digital signatures, UI enhancements
- **Phase 4.5**: Asset transfer feature
- **Phase 5.1**: OTP-based authentication, JWT tokens, role-based access control
- **Phase 5.2**: API route protection with authentication middleware

### Completed Technical Debt
- **Observability**: Pino logging, Sentry error tracking, health checks
- **Security Hardening**: Helmet headers, express-validator, CSRF protection
- **Testing Infrastructure**: Vitest (55 tests), Playwright E2E tests
- **Authentication**: OTP login, JWT + refresh tokens, RBAC

### API Route Protection (Phase 5.2)
All API routes are now protected with appropriate authentication and authorization:
- **Dashboard routes**: Require authentication (any role)
- **Assets routes**: Require staff or admin role
- **Employees routes**: Require staff or admin role
- **Handover routes**: Mixed - mutations require staff/admin, reads require auth, signature endpoints remain public
- **Locations routes**: Require authentication, mutations require staff/admin
- **Reminders trigger**: Require admin role
- **Health routes**: Remain public (for container orchestration)

**Next Phase:** Phase 6 - Reporting & Analytics Dashboard

See `ROADMAP.md` for detailed phase breakdown and future plans.
