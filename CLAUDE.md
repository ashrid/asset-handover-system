# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Asset Handover Management System for Ajman University - a full-stack web application that manages asset assignments to employees with automated PDF generation and email notifications.

## Architecture

### Frontend (React + Vite)
- **Entry**: `src/main.jsx` → `src/App.jsx`
- **Routing**: React Router with three main routes (`/assets`, `/handover`, `/assignments`)
- **State**: Local component state with fetch API for backend communication
- **Styling**: CSS-in-JS with global styles in `src/index.css`

### Backend (Node.js + Express)
- **Server**: `server/index.js` - Express server on port 3001
- **Database**: SQLite with better-sqlite3, initialized in `server/database.js`
- **Routes**: Modular route files in `server/routes/`
- **Services**: PDF generation (`pdfGenerator.js`) and email (`emailService.js`)

### Database Schema
- `assets`: 20+ fields including asset_code (unique), asset_type, hierarchical categories (1-4), hierarchical locations (1-4)
- `employees`: employee_name, employee_id, email, office_college
- `asset_assignments`: Links employees to assignments with PDF sent status
- `assignment_items`: Many-to-many relationship between assignments and assets

### Key Features
1. **Asset Management**: Full CRUD operations with extensive field support
2. **Handover Process**: Select multiple assets, assign to employee, auto-generate PDF, send email
3. **PDF Generation**: Dynamic table that includes LPO column only if assets have LPO numbers
4. **Email Service**: Uses Ethereal (dev) or configurable SMTP (production)
5. **Multi-Theme System**: 7 professional color themes with instant switching and localStorage persistence

### Theme System
- **Location**: `src/themes.js` (theme definitions), `src/components/ThemeSwitcher.jsx` (UI component)
- **Architecture**: Uses CSS custom properties (CSS variables) for dynamic theming
- **Themes Available**: Ajman Blue, Emerald Green, Royal Purple, Sunset Orange, Ocean Teal, Crimson Red, Midnight Black
- **Persistence**: User's theme choice saved to localStorage and restored on app load
- **Integration**: Theme initialized in `src/App.jsx`, switcher button in header
- **Styling**: All theme-dependent colors in `src/index.css` use `var(--theme-*)` variables

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

## Important Implementation Details

### PDF Generation
- Located in `server/services/pdfGenerator.js`
- Uses PDFKit to create formatted documents
- **Dynamic column rendering**: LPO column only appears if at least one asset has `lpo_voucher_no` set
- Includes AU declaration text, employee info, asset table, and signature field
- Handles pagination for large asset lists

### Email Service
- Located in `server/services/emailService.js`
- Development mode: Uses Ethereal test accounts (preview URLs logged to console)
- Production mode: Configured via environment variables (SMTP_HOST, SMTP_USER, etc.)
- Attaches generated PDF as `Asset_Handover_Form.pdf`

### API Proxy
- Vite dev server proxies `/api/*` requests to Express backend (configured in `vite.config.js`)
- Frontend makes relative API calls (e.g., `fetch('/api/assets')`)

### Database Initialization
- Database auto-creates on first server start
- Located at `server/assets.db` (gitignored)
- Uses synchronous better-sqlite3 for simplicity and performance

## Common Development Tasks

### Adding New Asset Fields
1. Update database schema in `server/database.js` (ALTER TABLE)
2. Update POST/PUT routes in `server/routes/assets.js`
3. Add form fields in `src/components/AssetForm.jsx`
4. Update display in `src/components/AssetList.jsx` if needed

### Modifying PDF Layout
Edit `server/services/pdfGenerator.js`:
- Adjust `colWidths` array for column sizing
- Modify `colPositions` calculation for spacing
- Update table header text and row rendering logic

### Changing Email Templates
Edit `server/services/emailService.js`:
- Modify `text` property for plain text email
- Modify `html` property for HTML email
- Update `subject` or `from` fields as needed

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
5. See THEMES.md for detailed color property documentation

## Testing Email in Development

When running in dev mode without SMTP config:
1. Send a handover email through the UI
2. Check server console for "Preview URL: https://ethereal.email/message/..."
3. Open the URL to view the sent email with PDF attachment

## Environment Configuration

Create `.env` file (copy from `.env.example`):
- Leave empty for development (uses Ethereal)
- Set SMTP credentials for production email sending
- Configure PORT if 3001 is unavailable

## Known Patterns

### Database Operations
- Uses prepared statements for all queries
- Transactions not currently used (consider for multi-step operations)
- All dates stored as TEXT in ISO format

### Error Handling
- Backend: Try-catch blocks with 500 status on errors
- Frontend: Sets message state `{type: 'error'|'success', text: string}`
- Unique constraint violations handled specifically (asset_code)

### Form Validation
- Required fields marked with asterisk in UI
- Backend validates required fields before database operations
- Email validation via HTML5 input type="email"

## Dependencies Note

### Package Versions
This project uses the latest stable versions as of November 2024:
- **React 19**: Latest React with improved performance
- **Express 5**: Latest Express.js version
- **better-sqlite3 12.x**: Latest version compatible with Node.js 24+
- **Vite 6**: Latest build tool
- **PDFKit 0.16**: Latest PDF generation library
- **Nodemailer 7**: Latest email library (secure version)

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
