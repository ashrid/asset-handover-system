# Asset Handover Management System

A web application for Ajman University to manage asset assignments to employees with automated PDF generation and email notifications.

## Features

- **Asset Management**: Create, read, update, and delete assets with comprehensive fields including asset code, type, description, model, serial number, categories, locations, and more
- **Employee Management**: Track employee information including name, ID, email, and office/college
- **Asset Handover**: Assign multiple assets to employees and automatically send handover confirmation emails with PDF attachments
- **PDF Generation**: Automatically generates professional PDF documents containing:
  - Employee information
  - Declaration statement
  - Asset table with selected columns (LPO column shown only if applicable)
  - Signature field
- **Email Notifications**: Sends formatted emails with PDF attachments to employees
- **Assignment Tracking**: View all asset assignments with status and details
- **Multi-Theme System**: Choose from 8 professional color themes with instant switching and persistent preferences

## Theme System

The application includes a flexible theme system with 8 professionally designed color schemes:

1. **Ajman Blue** (Default) - Professional corporate blue
2. **AU Official Brand** ⭐ (RECOMMENDED) - Official Ajman University colors (Orange #F29F00, Light Blue #39A9DC, Yellow #F6C900)
3. **Emerald Green** - Fresh and natural
4. **Royal Purple** - Sophisticated and creative
5. **Sunset Orange** - Energetic and warm
6. **Ocean Teal** - Modern and balanced
7. **Crimson Red** - Bold and powerful
8. **Midnight Black** - Sleek and minimalist

**How to Switch Themes**:
- Click the "Theme" button in the top-right corner of the header
- Select your preferred theme from the dropdown
- Your choice is automatically saved and persists across sessions

See [THEMES.md](THEMES.md) for detailed theme documentation.

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **PDF Generation**: PDFKit
- **Email**: Nodemailer

## Prerequisites

- Node.js 18+ and npm

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

3. Configure email settings (optional for development):
```bash
cp .env.example .env
# Edit .env with your SMTP settings for production
# Leave empty for development (uses Ethereal test email service)
```

## Development

Start both frontend and backend in development mode:
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

The frontend proxies API requests to the backend automatically.

## Production Build

Build the frontend for production:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Email Configuration

### Development
By default, the app uses [Ethereal Email](https://ethereal.email/) for testing emails in development. Email preview URLs are logged to the console.

### Production
Set these environment variables in `.env`:
```
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-password
EMAIL_FROM="Ajman University Asset Management <assets@ajman.ac.ae>"
```

## Database

The SQLite database (`server/assets.db`) is automatically created on first run with the following tables:
- `assets`: Store all asset information
- `employees`: Store employee details
- `asset_assignments`: Track asset handover assignments
- `assignment_items`: Link assets to assignments (many-to-many)

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

### Handover
- `POST /api/handover` - Create assignment and send handover email
- `GET /api/handover/assignments` - Get all assignments
- `GET /api/handover/assignments/:id` - Get assignment details

## Project Structure

```
asset-signing-confirm/
├── server/
│   ├── index.js              # Express server setup
│   ├── database.js           # Database initialization
│   ├── routes/
│   │   ├── assets.js         # Asset CRUD endpoints
│   │   ├── employees.js      # Employee CRUD endpoints
│   │   └── handover.js       # Handover and assignment endpoints
│   └── services/
│       ├── pdfGenerator.js   # PDF generation logic
│       └── emailService.js   # Email sending logic
├── src/
│   ├── main.jsx              # React entry point
│   ├── App.jsx               # Main app component
│   ├── index.css             # Global styles
│   ├── components/
│   │   ├── Header.jsx        # Navigation header
│   │   ├── AssetForm.jsx     # Asset creation/edit form
│   │   └── AssetList.jsx     # Asset table display
│   └── pages/
│       ├── AssetsPage.jsx    # Asset management page
│       ├── HandoverPage.jsx  # Asset handover page
│       └── AssignmentsPage.jsx # View assignments page
├── package.json
├── vite.config.js
└── index.html
```

## Usage

### Adding Assets
1. Navigate to "Manage Assets"
2. Click "Add New Asset"
3. Fill in required fields (Asset Code, Asset Type)
4. Add optional fields as needed
5. Click "Create Asset"

### Creating Asset Handover
1. Navigate to "Asset Handover"
2. Enter employee information (Name and Email are required)
3. Select assets to assign
4. Click "Send Handover Email"
5. Employee receives email with PDF attachment

### Viewing Assignments
1. Navigate to "View Assignments"
2. See all asset handovers with status
3. Click "View Details" to see assignment information

## License

MIT
