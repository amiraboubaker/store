# Security Implementation Guide

## Overview
This authentication system implements enterprise-grade security measures suitable for production e-commerce platforms.

---

## 1. Password Security

### Password Hashing
- **Algorithm:** bcryptjs (industry standard)
- **Salt Rounds:** 10 (configurable via `BCRYPT_ROUNDS` environment variable)
- **Automatic Hashing:** Passwords are hashed before storage using Mongoose pre-save hook
- **Never Stored in Plain Text:** Always hashed with unique salt per password

```javascript
// Example bcrypt implementation
const salt = await bcryptjs.genSalt(10);
const hashedPassword = await bcryptjs.hash(password, salt);
```

### Password Strength Requirements
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one digit (0-9)
- At least one special character (@$!%*?&)

**Validation:** Enforced both server-side and through express-validator

---

## 2. JWT Token Security

### Access Token
- **Algorithm:** HS256 (HMAC SHA-256)
- **Expiration:** 24 hours
- **Secret:** Environment-stored, minimum 32 characters recommended
- **Payload:**
  - User ID
  - Email
  - Role
  - Issue and Expiration timestamps

### Refresh Token
- **Algorithm:** HS256
- **Expiration:** 7 days
- **Separate Secret:** Different from access token secret
- **Purpose:** Obtain new access token without re-login

### Token Verification
```javascript
// Tokens are verified server-side on every protected request
jwt.verify(token, process.env.JWT_SECRET)
```

---

## 3. Authentication Middleware

### JWT Verification
- Validates token signature
- Checks token expiration
- Verifies user exists and is active
- Returns appropriate error codes for different failures

**Error Codes:**
- `AUTH_MISSING_TOKEN` - No token provided
- `AUTH_INVALID_TOKEN` - Invalid token format/signature
- `AUTH_TOKEN_EXPIRED` - Token past expiration
- `AUTH_USER_NOT_FOUND` - User no longer exists
- `AUTH_USER_INACTIVE` - User account deactivated

### Role-Based Access Control
```javascript
// Example: Admin-only route
router.get('/admin/users', 
  authMiddleware,
  roleMiddleware(['admin']),
  controller
);
```

**Roles:**
- `customer` - Regular users
- `admin` - Administrative access

---

## 4. Password Reset Security

### Secure Token Generation
```javascript
// Generate cryptographically secure random token
const resetToken = crypto.randomBytes(32).toString('hex');

// Hash token before storage (database never stores plaintext reset token)
const hashedToken = crypto
  .createHash('sha256')
  .update(resetToken)
  .digest('hex');
```

### Token Expiration
- **Validity:** 30 minutes from generation
- **Automatic Invalidation:** Token cannot be reused once used
- **One-Time Use:** `passwordResetUsed` flag prevents replay attacks

### Reset Flow
1. User requests password reset via email
2. Server generates secure token (not in URL without HTTPS)
3. Token sent to user (via email in production)
4. User submits token + new password
5. Server validates token (hasn't expired, hasn't been used)
6. Password updated, token marked as used

---

## 5. Input Validation

### All User Inputs Validated Server-Side
- Email format validation (RFC 5322 compliant regex)
- Name field validation (2-50 characters, letters only)
- Password strength requirements
- Confirmation password matching
- Length limits on all fields

**Never Trust Frontend Validation Alone**

### XSS Prevention
- Input sanitization through express-validator
- `trim()` removes whitespace
- `normalizeEmail()` standardizes email format
- No HTML stored directly; all data validated

### MongoDB Injection Prevention
- Mongoose schema enforces type checking
- Input validation prevents injection
- Parameterized queries used exclusively

---

## 6. Account Security

### Failed Login Attempt Tracking
```javascript
// Automatically lock after 5 failed attempts
loginAttempts: 5 → Account locked for 2 hours
```

**Features:**
- Increments counter on failed login
- Locks account after threshold reached
- Auto-unlock after 2-hour lockout period
- Reset counter on successful login

**Error Response:**
```json
{
  "code": "ACCOUNT_LOCKED",
  "message": "Account is temporarily locked..."
}
```

### Account Status Monitoring
- `isActive` flag for account deactivation
- `lastLoginAt` timestamp for audit
- `isEmailVerified` for future email verification
- Timestamps (`createdAt`, `updatedAt`) for auditing

---

## 7. CORS & CSRF Protection

### CORS Configuration
```javascript
const corsOptions = {
  origin: process.env.CORS_ORIGIN.split(','),
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

**Configuration:**
- Whitelist trusted domains
- Allow credentials in cross-origin requests
- Environment-based configuration

**Prevent CSRF:**
- SameSite cookies (when using cookies)
- CORS origin validation
- Token-based authentication (JWT not vulnerable to CSRF as JSON endpoints)

---

## 8. Secure Headers & Response Handling

### Payload Size Limiting
```javascript
app.use(express.json({ limit: '10kb' }));
```

Prevents DoS through oversized payloads

### Standardized Response Format
```json
{
  "status": "success|error",
  "code": "OPERATION_CODE",
  "message": "Human-readable message",
  "data": {...}
}
```

**Never Returns:**
- Plain text passwords
- Sensitive user data unless authorized
- Database error details in production
- Stack traces in production

### Error Information Disclosure
- Generic messages for auth failures (doesn't reveal if email exists)
- Specific validation errors for user feedback
- Detailed errors in development mode only

---

## 9. Environment Variables & Secrets Management

### Required Secrets
```bash
JWT_SECRET=min_32_character_secret_key
JWT_REFRESH_SECRET=min_32_character_refresh_secret
MONGODB_URI=connection_string
```

**Never:**
- Hardcode secrets in source code
- Commit `.env` to version control
- Expose secrets in logs or responses
- Use weak defaults in production

**Best Practice:**
```bash
# .env.example - shows structure but not actual values
JWT_SECRET=your_secret_here

# .env - NEVER committed, actual values only
JWT_SECRET=ak7f9d8s7f9sd8f7sd9f7sd9f7sd9f7sd9f7s
```

---

## 10. Database Security

### Password Normalization
```javascript
// Email automatically normalized
email: { lowercase: true, trim: true }

// Prevents duplicate accounts (test@email.com vs TEST@email.com)
unique: true, index: true
```

### No Password in Default Queries
```javascript
const user = await User.findById(id);
// password NOT included (select: false)

// Only when needed
const user = await User.findById(id).select('+password');
```

### Sensitive Fields Excluded from Default Queries
```javascript
password: { select: false }           // Never by default
passwordResetToken: { select: false } // Only for reset
passwordResetExpires: { select: false }
loginAttempts: { select: false }
lockUntil: { select: false }
```

---

## 11. HTTP Status Codes & Error Handling

### Proper HTTP Status Usage
| Code | Scenario |
|------|----------|
| 201 | User successfully registered |
| 200 | Successful login, token refresh, profile update |
| 400 | Validation error, invalid reset token |
| 401 | Missing/invalid token, invalid credentials |
| 403 | Insufficient permissions (role check) |
| 429 | Account locked (rate limiting) |
| 500 | Server error |

---

## 12. Audit Trail & Logging

### Tracked Events
- User registration (email, timestamp)
- Login attempts (failed/successful, timestamp)
- Password changes (timestamp, by user)
- Password resets (timestamp, token usage)
- Failed login attempts (count, lockout)
- Profile updates (old/new values)
- Role changes (by admin, timestamp)

**Development Logging:**
```javascript
[2024-01-15T10:30:00.000Z] POST /auth/login
```

---

## 13. Production Hardening Checklist

### Before Deployment

- [ ] Set `NODE_ENV=production`
- [ ] Generate strong JWT secrets (min 32 chars, random)
- [ ] Use HTTPS only (no HTTP)
- [ ] Set secure CORS_ORIGIN (specific domains)
- [ ] Configure MongoDB connection securely
- [ ] Enable MongoDB authentication
- [ ] Set up email service for password resets
- [ ] Implement rate limiting on all endpoints
- [ ] Enable request logging for security events
- [ ] Set up database backups
- [ ] Configure monitoring/alerting
- [ ] Implement API key system for integrations
- [ ] Setup SSL/TLS certificates
- [ ] Enable firewall rules
- [ ] Review and test all error responses
- [ ] Implement WAF (Web Application Firewall)
- [ ] Setup DDoS protection
- [ ] Enable database encryption

### Monitoring
- Failed login attempts spikes
- Unusual API access patterns
- Token validation failures
- Database connection errors
- Request rate anomalies

---

## 14. Common Vulnerabilities Addressed

### OWASP Top 10

1. **Broken Authentication**
   - ✓ Secure password hashing (bcrypt)
   - ✓ JWT token expiration
   - ✓ Account lockout mechanism
   - ✓ Password reset token expiration

2. **Sensitive Data Exposure**
   - ✓ Passwords never in responses
   - ✓ HTTPS recommended
   - ✓ Secrets in environment variables
   - ✓ Sensitive fields excluded from queries

3. **Injection**
   - ✓ Input validation and sanitization
   - ✓ Mongoose schema validation
   - ✓ No raw queries used

4. **Broken Access Control**
   - ✓ Role-based middleware
   - ✓ Protected routes require authentication
   - ✓ User can only access own data

5. **Cross-Site Request Forgery (CSRF)**
   - ✓ CORS validation
   - ✓ Token-based authentication
   - ✓ SameSite cookie configuration

6. **Security Misconfiguration**
   - ✓ Environment variables for config
   - ✓ Proper error handling (no stack traces)
   - ✓ Secure defaults

---

## 15. Additional Security Recommendations

### Email Verification
```javascript
// Add in production
isEmailVerified: { type: Boolean, default: false }
// Send verification email, validate before account usage
```

### Two-Factor Authentication (2FA)
```javascript
// Future enhancement
twoFactorEnabled: Boolean,
twoFactorSecret: String (select: false)
```

### OAuth Integration
- Google/GitHub/Facebook social login
- Reduces password storage burden
- Industry-standard implementation

### Rate Limiting
```javascript
// Implement per-endpoint
POST /auth/login → max 5 attempts/15 minutes
POST /auth/register → max 10 registrations/hour
```

### Token Blacklist (Optional)
```javascript
// For immediate logout
const tokenBlacklist = new Set();
// On logout: tokenBlacklist.add(token);
// On verify: if (tokenBlacklist.has(token)) reject;
```

### API Key System
```javascript
// For third-party integrations
apiKey: String (select: false, index: true)
apiKeyCreatedAt: Date
```

---

## 16. Testing Security

### Unit Tests
- Password hashing verification
- Token generation and verification
- Input validation
- Role-based access

### Integration Tests
- Full registration flow
- Login with account lockout
- Password reset process
- Token refresh

### Security Tests
- Brute force attempts
- Invalid token rejection
- Missing authentication header
- SQL injection attempts
- XSS payload attempts

---

## References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [bcryptjs Documentation](https://www.npmjs.com/package/bcryptjs)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

## Support & Updates

For security vulnerabilities, please report to: security@couture-supplies.com

Last Updated: 2024-01-15
Version: 1.0.0
