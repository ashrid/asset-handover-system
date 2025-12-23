# Product Requirements Document: Phase 5.2 - API Route Protection

**Document Version:** 1.0
**Created:** December 2025
**Status:** Ready for Implementation
**Author:** Product Manager (AI-Assisted)

---

## 1. Executive Summary

### 1.1 Purpose
Phase 5.2 implements authentication and authorization middleware across all existing API routes, building on the authentication infrastructure established in Phase 5.1 (OTP-based login, JWT tokens, role-based access control).

### 1.2 Goal
Secure all API endpoints with appropriate authentication and role-based access control, ensuring:
- Only authenticated users can access protected resources
- Users can only perform actions permitted by their role
- Public endpoints (signature collection) remain accessible without authentication

### 1.3 Success Criteria
- 100% of protected endpoints require valid JWT authentication
- Role-based restrictions enforced correctly
- Zero regression in existing functionality
- Public signature endpoints remain accessible
- All tests pass with authentication requirements

---

## 2. Current State Analysis

### 2.1 Authentication Infrastructure (Phase 5.1 - Complete)

| Component | Status | Location |
|-----------|--------|----------|
| Auth Middleware | Complete | `server/middleware/auth.js` |
| Token Service | Complete | `server/services/tokenService.js` |
| OTP Service | Complete | `server/services/otpService.js` |
| User Model | Complete | Database `users` table |
| Auth Routes | Complete | `server/routes/auth.js` |
| User Management | Complete | `server/routes/users.js` |

### 2.2 Available Middleware

```javascript
// From server/middleware/auth.js
authenticateToken    // Validates JWT, attaches req.user
requireRole(...roles)// Requires specific role(s)
optionalAuth         // Attaches user if token present
requireAdmin         // [authenticateToken, requireRole('admin')]
requireStaff         // [authenticateToken, requireRole('admin', 'staff')]
requireAuth          // [authenticateToken]
```

### 2.3 Current Route Protection Status

| Route File | Protected | Notes |
|------------|-----------|-------|
| `auth.js` | Partial | Public login endpoints + protected logout |
| `users.js` | **Complete** | All routes protected with admin role |
| `health.js` | N/A | Should remain public |
| `assets.js` | **UNPROTECTED** | Needs Phase 5.2 |
| `employees.js` | **UNPROTECTED** | Needs Phase 5.2 |
| `handover.js` | **UNPROTECTED** | Needs Phase 5.2 (partial - some public) |
| `dashboard.js` | **UNPROTECTED** | Needs Phase 5.2 |
| `locations.js` | **UNPROTECTED** | Needs Phase 5.2 |
| `reminders/trigger` | **UNPROTECTED** | Needs Phase 5.2 |

---

## 3. User Personas & Roles

### 3.1 Role Definitions

| Role | Description | Capabilities |
|------|-------------|--------------|
| **Admin** | System administrators | Full access to all features including user management |
| **Staff** | Asset management staff | Manage assets, employees, assignments, handovers |
| **Viewer** | Read-only users | View dashboard, view assignments (no modifications) |
| **Public** | Unauthenticated users | Access signature/dispute submission only |

### 3.2 Access Matrix

| Feature Area | Admin | Staff | Viewer | Public |
|--------------|-------|-------|--------|--------|
| Dashboard Stats | Read | Read | Read | - |
| Dashboard Charts | Read | Read | Read | - |
| Dashboard Activity | Read | Read | Read | - |
| Pending Signatures | Read | Read | Read | - |
| Assets List | Read | Read | - | - |
| Assets Create | Write | Write | - | - |
| Assets Update | Write | Write | - | - |
| Assets Delete | Write | Write | - | - |
| Assets Bulk Import | Write | Write | - | - |
| Employees List | Read | Read | - | - |
| Employees Create | Write | Write | - | - |
| Employees Update | Write | Write | - | - |
| Employees Delete | Write | Write | - | - |
| Assignments List | Read | Read | Read | - |
| Assignments Details | Read | Read | Read | - |
| Create Handover | Write | Write | - | - |
| Edit Assignment Assets | Write | Write | - | - |
| Delete Assignment | Write | Write | - | - |
| Resend Email | Write | Write | - | - |
| Transfer Assets | Write | Write | - | - |
| Sign Assignment | - | - | - | Write |
| Submit Dispute | - | - | - | Write |
| View Signing Page | - | - | - | Read |
| User Management | Full | - | - | - |
| Trigger Reminders | Write | - | - | - |
| Location Options | Read | Read | - | - |

---

## 4. Detailed Requirements

### 4.1 Assets Routes (`/api/assets`)

| Endpoint | Method | Current | Required Protection |
|----------|--------|---------|---------------------|
| `/api/assets` | GET | Public | `requireStaff` |
| `/api/assets/:id` | GET | Public | `requireStaff` |
| `/api/assets` | POST | Public | `requireStaff` |
| `/api/assets/:id` | PUT | Public | `requireStaff` |
| `/api/assets/:id` | DELETE | Public | `requireStaff` |
| `/api/assets/bulk-import` | POST | Public | `requireStaff` |

**Implementation Pattern:**
```javascript
import { requireStaff } from '../middleware/auth.js';

// Apply to all routes
router.use(requireStaff);
```

### 4.2 Employees Routes (`/api/employees`)

| Endpoint | Method | Current | Required Protection |
|----------|--------|---------|---------------------|
| `/api/employees` | GET | Public | `requireStaff` |
| `/api/employees/:id` | GET | Public | `requireStaff` |
| `/api/employees` | POST | Public | `requireStaff` |
| `/api/employees/:id` | PUT | Public | `requireStaff` |
| `/api/employees/:id` | DELETE | Public | `requireStaff` |

**Implementation Pattern:**
```javascript
import { requireStaff } from '../middleware/auth.js';

router.use(requireStaff);
```

### 4.3 Handover Routes (`/api/handover`)

This route requires **mixed protection** - some endpoints are public (for signature collection).

| Endpoint | Method | Current | Required Protection |
|----------|--------|---------|---------------------|
| `/api/handover` | POST | Public | `requireStaff` |
| `/api/handover/assignments` | GET | Public | `requireAuth` |
| `/api/handover/assignments/:id` | GET | Public | `requireAuth` |
| `/api/handover/assignments/:id` | DELETE | Public | `requireStaff` |
| `/api/handover/assignments/:id/assets` | PUT | Public | `requireStaff` |
| `/api/handover/resend/:id` | POST | Public | `requireStaff` |
| `/api/handover/transfer/:id` | POST | Public | `requireStaff` |
| `/api/handover/sign/:token` | GET | Public | **Stay Public** |
| `/api/handover/submit-signature/:token` | POST | Public | **Stay Public** |
| `/api/handover/dispute/:token` | POST | Public | **Stay Public** |

**Implementation Pattern:**
```javascript
import { authenticateToken, requireRole, requireStaff, requireAuth } from '../middleware/auth.js';

// Protected routes - Apply individually
router.post('/', requireStaff, handoverValidation.create, async (req, res) => { ... });
router.get('/assignments', requireAuth, (req, res) => { ... });
router.get('/assignments/:id', requireAuth, (req, res) => { ... });
router.delete('/assignments/:id', requireStaff, (req, res) => { ... });
router.put('/assignments/:id/assets', requireStaff, handoverValidation.updateAssets, async (req, res) => { ... });
router.post('/resend/:id', requireStaff, handoverValidation.resend, async (req, res) => { ... });
router.post('/transfer/:id', requireStaff, handoverValidation.transfer, async (req, res) => { ... });

// Public routes - NO CHANGES
router.get('/sign/:token', (req, res) => { ... });
router.post('/submit-signature/:token', handoverValidation.submitSignature, async (req, res) => { ... });
router.post('/dispute/:token', handoverValidation.submitDispute, async (req, res) => { ... });
```

### 4.4 Dashboard Routes (`/api/dashboard`)

| Endpoint | Method | Current | Required Protection |
|----------|--------|---------|---------------------|
| `/api/dashboard/stats` | GET | Public | `requireAuth` |
| `/api/dashboard/charts` | GET | Public | `requireAuth` |
| `/api/dashboard/activity` | GET | Public | `requireAuth` |
| `/api/dashboard/pending-signatures` | GET | Public | `requireAuth` |
| `/api/dashboard/recent-transfers` | GET | Public | `requireAuth` |
| `/api/dashboard/timeline` | GET | Public | `requireAuth` |

**Implementation Pattern:**
```javascript
import { requireAuth } from '../middleware/auth.js';

router.use(requireAuth);
```

### 4.5 Locations Routes (`/api/locations`)

| Endpoint | Method | Current | Required Protection |
|----------|--------|---------|---------------------|
| `/api/locations` | GET | Public | `requireAuth` |

**Implementation Pattern:**
```javascript
import { requireAuth } from '../middleware/auth.js';

router.use(requireAuth);
```

### 4.6 Reminders Trigger (`/api/reminders/trigger`)

| Endpoint | Method | Current | Required Protection |
|----------|--------|---------|---------------------|
| `/api/reminders/trigger` | POST | Public | `requireAdmin` |

**Implementation Pattern (in server/index.js):**
```javascript
import { requireAdmin } from './middleware/auth.js';

app.post('/api/reminders/trigger', requireAdmin, async (req, res) => { ... });
```

### 4.7 Health Routes (`/api/health`)

| Endpoint | Method | Current | Required Protection |
|----------|--------|---------|---------------------|
| `/api/health` | GET | Public | **Stay Public** |
| `/api/health/detailed` | GET | Public | **Stay Public** |
| `/api/health/live` | GET | Public | **Stay Public** |
| `/api/health/ready` | GET | Public | **Stay Public** |

**Rationale:** Health check endpoints must remain public for:
- Container orchestration (Kubernetes probes)
- Load balancer health checks
- Monitoring systems

---

## 5. Frontend Integration Requirements

### 5.1 AuthContext Updates

The `authFetch` helper in `src/contexts/AuthContext.jsx` already handles:
- Automatic token attachment
- 401 response → token refresh → retry
- 403 response → redirect to dashboard with error

**No frontend changes required** - the existing implementation is sufficient.

### 5.2 Error Handling

The frontend should display appropriate messages for:

| HTTP Status | Meaning | User Message |
|-------------|---------|--------------|
| 401 | Not authenticated | "Session expired. Please login again." |
| 403 | Insufficient permissions | "You don't have permission to perform this action." |

---

## 6. Implementation Plan

### 6.1 Implementation Order

1. **Dashboard Routes** (Low risk - read-only)
2. **Locations Routes** (Low risk - read-only)
3. **Assets Routes** (Medium risk - requires staff role)
4. **Employees Routes** (Medium risk - requires staff role)
5. **Handover Routes** (High complexity - mixed public/protected)
6. **Reminders Trigger** (Low risk - admin only)

### 6.2 Step-by-Step Tasks

#### Step 1: Dashboard Protection
```bash
# File: server/routes/dashboard.js
- Import auth middleware
- Add router.use(requireAuth) at top
- Test all dashboard endpoints return 401 without token
- Test all dashboard endpoints work with valid token
```

#### Step 2: Locations Protection
```bash
# File: server/routes/locations.js
- Import auth middleware
- Add router.use(requireAuth) at top
- Test location endpoints
```

#### Step 3: Assets Protection
```bash
# File: server/routes/assets.js
- Import auth middleware
- Add router.use(requireStaff) at top
- Test CRUD operations require staff/admin role
- Test viewer role gets 403
```

#### Step 4: Employees Protection
```bash
# File: server/routes/employees.js
- Import auth middleware
- Add router.use(requireStaff) at top
- Test CRUD operations require staff/admin role
```

#### Step 5: Handover Protection
```bash
# File: server/routes/handover.js
- Import auth middleware
- Add protection to individual routes (NOT router.use)
- Ensure public routes (/sign/:token, /submit-signature/:token, /dispute/:token) remain unprotected
- Test protected routes require appropriate roles
- Test public routes still work without authentication
```

#### Step 6: Reminders Protection
```bash
# File: server/index.js
- Import requireAdmin middleware
- Add requireAdmin to /api/reminders/trigger route
- Test only admin can trigger reminders
```

### 6.3 Rollback Strategy

Each route file change is independent. If issues arise:
1. Revert the specific route file
2. Restart server
3. Investigate and fix before re-applying

---

## 7. Testing Requirements

### 7.1 Unit Tests

For each protected route, test:
- Request without token → 401
- Request with invalid token → 401
- Request with expired token → 401
- Request with valid token, wrong role → 403
- Request with valid token, correct role → 2xx

### 7.2 Integration Tests

Update existing integration tests to:
- Include authentication headers
- Test role-based access control

### 7.3 E2E Tests

Verify complete user flows:
- Login → Dashboard access
- Login (admin) → User management access
- Login (viewer) → Cannot create assets
- Public signature flow works without login

### 7.4 Test Matrix

| Route | No Token | Invalid Token | Admin | Staff | Viewer |
|-------|----------|---------------|-------|-------|--------|
| GET /api/dashboard/stats | 401 | 401 | 200 | 200 | 200 |
| GET /api/assets | 401 | 401 | 200 | 200 | 403 |
| POST /api/assets | 401 | 401 | 201 | 201 | 403 |
| GET /api/handover/sign/:token | 200 | 200 | 200 | 200 | 200 |
| POST /api/handover | 401 | 401 | 201 | 201 | 403 |
| POST /api/reminders/trigger | 401 | 401 | 200 | 403 | 403 |

---

## 8. Security Considerations

### 8.1 Token Handling
- Access tokens expire in 15 minutes
- Refresh tokens stored in httpOnly cookies
- Tokens revoked on logout

### 8.2 Rate Limiting
- OTP requests already rate-limited (Phase 5.1)
- Consider adding rate limiting to protected endpoints in future phase

### 8.3 Audit Logging
- Auth middleware already logs access denials
- Consider expanding audit trail in future phase

### 8.4 CORS Configuration
- Already configured in server/index.js
- No changes needed for Phase 5.2

---

## 9. Dependencies

### 9.1 Prerequisites
- Phase 5.1 complete (OTP auth, JWT, RBAC)
- Existing auth middleware functional
- Frontend AuthContext with authFetch helper

### 9.2 No New Dependencies
This phase uses existing middleware and infrastructure.

---

## 10. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Breaking public signature endpoints | High | Medium | Careful route-level protection (not router.use) |
| Frontend auth refresh issues | Medium | Low | Existing authFetch already handles 401 |
| Test suite failures | Medium | High | Update tests with auth headers |
| User confusion during rollout | Low | Low | No UI changes, transparent to users |

---

## 11. Success Metrics

### 11.1 Technical Metrics
- 100% of protected endpoints return 401 without valid token
- 100% of role-restricted endpoints return 403 for unauthorized roles
- 0 regressions in existing functionality
- All automated tests pass

### 11.2 Security Metrics
- No unauthorized access to protected resources
- Audit logs capture all access denied events

---

## 12. Post-Implementation Checklist

- [ ] All route files updated with auth middleware
- [ ] Public signature endpoints verified to work without auth
- [ ] Unit tests updated and passing
- [ ] Integration tests updated and passing
- [ ] E2E tests updated and passing
- [ ] Manual testing complete for all roles
- [ ] CLAUDE.md updated with Phase 5.2 status
- [ ] ROADMAP.md updated

---

## Appendix A: Code Snippets

### A.1 Dashboard Route Protection Example

```javascript
// server/routes/dashboard.js
import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import db from '../database.js';

const router = express.Router();

// Protect all dashboard routes - any authenticated user can view
router.use(requireAuth);

// GET /api/dashboard/stats
router.get('/stats', (req, res) => {
  // ... existing implementation
});

export default router;
```

### A.2 Handover Route Mixed Protection Example

```javascript
// server/routes/handover.js
import express from 'express';
import { requireAuth, requireStaff } from '../middleware/auth.js';

const router = express.Router();

// Protected: Create handover (staff/admin only)
router.post('/', requireStaff, handoverValidation.create, async (req, res) => {
  // ... existing implementation
});

// Protected: View assignments (any authenticated user)
router.get('/assignments', requireAuth, (req, res) => {
  // ... existing implementation
});

// PUBLIC: Signature collection (no auth)
router.get('/sign/:token', (req, res) => {
  // ... existing implementation - NO CHANGES
});

router.post('/submit-signature/:token', handoverValidation.submitSignature, async (req, res) => {
  // ... existing implementation - NO CHANGES
});

router.post('/dispute/:token', handoverValidation.submitDispute, async (req, res) => {
  // ... existing implementation - NO CHANGES
});

export default router;
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2025 | PM | Initial PRD |
