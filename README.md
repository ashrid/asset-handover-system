# Asset Handover Management System

A full-stack web application for Ajman University to manage asset assignments to employees with automated PDF generation, email notifications, digital signatures, role-based authentication, and automated reminders.

## Features

### Core Features
- **Asset Management**: Full CRUD operations with 20+ fields including asset code, type, categories, locations, and more
- **Employee Management**: Track employee information including name, ID, email, and office/college
- **Excel Import**: Bulk import assets from .xls/.xlsx files
- **Asset Handover**: Assign multiple assets to employees with automated PDF generation and email notifications
- **Digital Signature**: Public signing page with canvas signature capture (no login required)
- **PDF Generation**: Professional PDF documents with employee info, asset table, and embedded signatures

### Authentication & Security (Phase 5)
- **OTP-Based Login**: Passwordless authentication via Employee ID + 6-digit OTP sent to email
- **JWT + Refresh Tokens**: Access tokens (15 min) + refresh tokens (7 days, httpOnly cookie)
- **Role-Based Access Control**: Three roles with different permissions:
  | Role | Capabilities |
  |------|-------------|
  | **Admin** | Full access including user management |
  | **Staff** | Manage assets, employees, and assignments |
  | **Viewer** | Read-only access to dashboard and assignments |
- **Protected API Routes**: All endpoints secured with appropriate authentication and authorization

### Admin Features
- **User Management**: Create, update, and deactivate user accounts (admin only)
- **Automated Reminders**: Weekly email reminders for unsigned assignments (max 4 reminders)
- **Admin Notifications**: Automatic copy of signed PDFs and dispute alerts
- **Resend Email**: Resend signing links for unsigned assignments
- **Edit Assets**: Modify assigned assets in unsigned assignments
- **Asset Transfer**: Transfer assets between employees with full tracking

### Additional Features
- **Backup Email Support**: Secondary email for senior sign-off when employee is unavailable
- **Dispute Handling**: Employees can dispute assignments with reason tracking
- **Multi-Theme System**: 8 professional color themes with instant switching

## Tech Stack

- **Frontend**: React 19 + Vite 6
- **Backend**: Node.js + Express 5
- **Database**: SQLite (better-sqlite3)
- **PDF Generation**: PDFKit
- **Email**: Nodemailer
- **Authentication**: JWT (jsonwebtoken)
- **Testing**: Vitest + Playwright

## Prerequisites

- Node.js 20+ and npm

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd asset-signing-confirm
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment (optional for development):
```bash
cp .env.example .env
# Edit .env with your settings
```

4. Run database migrations:
```bash
node server/migrations/006_add_auth_tables.js
node server/migrations/007_add_otp_failed_attempts.js
```

5. Create initial admin user:
```bash
# List available employees
node server/seeds/createAdmin.js

# Create admin from employee ID
node server/seeds/createAdmin.js 1
```

## Development

Start both frontend and backend:
```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Other Commands

```bash
npm run dev:client    # Frontend only
npm run dev:server    # Backend only
npm run build         # Production build
npm start             # Production server
npm test              # Run all tests
npm run test:e2e      # Run E2E tests
```

## Environment Configuration

### Required for Production
```env
# JWT Secrets (generate secure random strings!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production

# SMTP Email Configuration
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-password
EMAIL_FROM="Asset Management <assets@ajman.ac.ae>"

# Admin Email (receives signed PDFs and dispute notifications)
ADMIN_EMAIL=store@ajman.ac.ae

# Base URL (used in signing links)
BASE_URL=https://yourdomain.com
```

### Optional Configuration
```env
PORT=3001                           # Server port
REMINDER_CRON_SCHEDULE=0 9 * * *    # Daily at 9 AM
TZ=Asia/Dubai                       # Timezone
LOG_LEVEL=info                      # Logging level
OTP_EXPIRY_MINUTES=10               # OTP expiration
```

### Development
- Leave SMTP settings empty to use Ethereal test email service
- Email preview URLs are logged to the console

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/request-otp` | Public | Send OTP to employee email |
| POST | `/verify-otp` | Public | Verify OTP, get tokens |
| POST | `/refresh` | Cookie | Refresh access token |
| POST | `/logout` | Required | Logout current session |
| POST | `/logout-all` | Required | Logout all devices |
| GET | `/me` | Required | Get current user info |

### Users (`/api/users`) - Admin Only
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all users |
| POST | `/` | Create user (link employee) |
| PUT | `/:id` | Update user role/status |
| DELETE | `/:id` | Deactivate user |
| GET | `/available/employees` | Get unlinked employees |

### Assets (`/api/assets`) - Staff/Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all assets |
| GET | `/:id` | Get single asset |
| POST | `/` | Create asset |
| PUT | `/:id` | Update asset |
| DELETE | `/:id` | Delete asset |

### Employees (`/api/employees`) - Staff/Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all employees |
| GET | `/:id` | Get single employee |
| POST | `/` | Create employee |
| PUT | `/:id` | Update employee |
| DELETE | `/:id` | Delete employee |

### Handover (`/api/handover`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Staff/Admin | Create assignment |
| GET | `/assignments` | Required | Get all assignments |
| GET | `/assignments/:id` | Required | Get assignment details |
| PUT | `/assignments/:id/assets` | Staff/Admin | Edit assets |
| DELETE | `/assignments/:id` | Staff/Admin | Delete assignment |
| POST | `/resend/:id` | Staff/Admin | Resend signing email |
| POST | `/transfer/:id` | Staff/Admin | Transfer assets |
| GET | `/sign/:token` | **Public** | Get signing page |
| POST | `/submit-signature/:token` | **Public** | Submit signature |
| POST | `/dispute/:token` | **Public** | Submit dispute |

### Dashboard (`/api/dashboard`) - Authenticated
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Core metrics |
| GET | `/activity` | Recent activity |
| GET | `/charts` | Chart data |

### Other
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/locations/options` | Required | Location dropdowns |
| POST | `/api/reminders/trigger` | Admin | Manual reminder trigger |
| GET | `/api/health` | Public | Health check |

## Theme System

8 professional color themes with instant switching:

1. **Ajman Blue** (Default) - Professional corporate blue
2. **AU Official Brand** - Official Ajman University colors
3. **Emerald Green** - Fresh and natural
4. **Royal Purple** - Sophisticated and creative
5. **Sunset Orange** - Energetic and warm
6. **Ocean Teal** - Modern and balanced
7. **Crimson Red** - Bold and powerful
8. **Midnight Black** - Sleek and minimalist

**How to Switch**: Click "Theme" button in header, select from dropdown. Choice persists across sessions.

## Project Structure

```
asset-signing-confirm/
├── server/
│   ├── index.js              # Express server
│   ├── database.js           # SQLite initialization
│   ├── routes/
│   │   ├── auth.js           # Authentication endpoints
│   │   ├── users.js          # User management (admin)
│   │   ├── assets.js         # Asset CRUD
│   │   ├── employees.js      # Employee CRUD
│   │   ├── handover.js       # Handover & assignments
│   │   ├── dashboard.js      # Dashboard analytics
│   │   └── locations.js      # Location options
│   ├── services/
│   │   ├── otpService.js     # OTP management
│   │   ├── tokenService.js   # JWT management
│   │   ├── pdfGenerator.js   # PDF generation
│   │   ├── emailService.js   # Email handling
│   │   └── reminderService.js# Automated reminders
│   ├── middleware/
│   │   ├── auth.js           # Authentication middleware
│   │   ├── validation.js     # Input validation
│   │   └── security.js       # Security headers
│   └── migrations/           # Database migrations
├── src/
│   ├── main.jsx              # React entry
│   ├── App.jsx               # Main app with routing
│   ├── contexts/
│   │   └── AuthContext.jsx   # Auth state management
│   ├── components/
│   │   ├── Header.jsx        # Navigation
│   │   ├── ProtectedRoute.jsx# Route protection
│   │   └── ...               # Other components
│   └── pages/
│       ├── LoginPage.jsx     # OTP login
│       ├── Dashboard.jsx     # Analytics
│       ├── AssetsPage.jsx    # Asset management
│       ├── UserManagementPage.jsx # User admin
│       └── ...               # Other pages
├── tests/
│   ├── unit/                 # Unit tests
│   ├── integration/          # API tests
│   └── e2e/                  # Playwright tests
└── docs/                     # Documentation
```

## Testing

```bash
npm test                    # All tests (55 passing)
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
npm run test:e2e            # E2E tests (Playwright)
```

## Security Features

- **OTP Rate Limiting**: 5 requests/15 min (production), 20 (development)
- **Failed OTP Attempts**: OTP invalidated after 3 wrong attempts
- **JWT Expiration**: Access tokens (15 min), refresh tokens (7 days)
- **Security Headers**: Helmet (CSP, HSTS, XSS protection)
- **Input Validation**: express-validator on all endpoints
- **CSRF Protection**: Content-Type + Origin validation
- **SQL Injection Prevention**: Parameterized queries

## License

MIT
