# Couture Supplies E-Commerce - Authentication System

A production-ready, secure authentication system for e-commerce platforms built with Node.js, Express, MongoDB, and JWT.

## Features

### Core Authentication
- ✓ User registration with email validation
- ✓ Secure login with bcrypt password hashing
- ✓ JWT-based authentication with expiration
- ✓ Refresh token mechanism for long sessions
- ✓ Logout functionality
- ✓ Secure password reset with time-limited tokens

### Security
- ✓ bcryptjs password hashing (salt rounds: 10)
- ✓ JWT token expiration (24h access, 7d refresh)
- ✓ Account lockout after 5 failed login attempts (2h lockout)
- ✓ Secure password reset tokens (30-minute expiry, one-time use)
- ✓ Role-based access control (customer, admin)
- ✓ Input validation and sanitization
- ✓ CORS protection
- ✓ No sensitive data in API responses
- ✓ Environment variable secret management

### User Management
- ✓ User profile retrieval and updates
- ✓ Password change (requires current password)
- ✓ Account deactivation capability
- ✓ Login attempt tracking
- ✓ Last login timestamp

---

## Project Structure

```
src/
├── models/
│   └── User.js                 # MongoDB User schema
├── controllers/
│   └── AuthController.js       # Request handlers
├── services/
│   └── AuthService.js          # Business logic
├── middleware/
│   ├── auth.js                 # JWT verification & role-based access
│   └── validation.js           # Input validation
├── routes/
│   ├── auth.js                 # Authentication endpoints
│   └── protected.example.js    # Protected route examples
└── index.js                    # Express server setup

.env.example                    # Environment variable template
.env                            # Actual secrets (not in repo)
API_ROUTES.md                   # API documentation
SECURITY.md                     # Security implementation details
README.md                       # This file
```

---

## Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
cd c:\e-store\store
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
# Copy example file
cp .env.example .env

# Edit .env with your values
# Important: Set strong JWT_SECRET (min 32 chars)
```

4. **Start MongoDB** (if running locally)
```bash
# Windows
mongod

# macOS/Linux
mongod --dbpath /usr/local/var/mongodb
```

5. **Start the server**

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

You should see:
```
╔════════════════════════════════════════════╗
║  Couture Supplies Auth API                  ║
║  Server running on port 5000                ║
║  Environment: development                   ║
╚════════════════════════════════════════════╝
```

6. **Test the API**
```bash
curl http://localhost:5000/health
```

---

## API Overview

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/auth/register` | Create new user account | No |
| POST | `/auth/login` | Login and get tokens | No |
| POST | `/auth/logout` | Logout user | Yes |
| POST | `/auth/refresh` | Get new access token | No |
| POST | `/auth/request-password-reset` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password with token | No |
| GET | `/auth/me` | Get current user profile | Yes |
| PUT | `/auth/profile` | Update user profile | Yes |
| POST | `/auth/change-password` | Change password | Yes |

### Protected Route Examples

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/admin/users` | admin | Get all users |
| DELETE | `/admin/users/:id` | admin | Delete user |
| PUT | `/admin/users/:id/role` | admin | Update user role |
| GET | `/customer/orders` | customer | Get user's orders |
| POST | `/customer/orders` | customer | Create new order |

---

## Example Workflows

### User Registration

```javascript
// Request
POST /auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}

// Response (201 Created)
{
  "status": "success",
  "code": "USER_REGISTERED",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### User Login

```javascript
// Request
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

// Response (200 OK)
{
  "status": "success",
  "code": "LOGIN_SUCCESS",
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Access Protected Route

```javascript
// Request
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Response (200 OK)
{
  "status": "success",
  "code": "USER_PROFILE_RETRIEVED",
  "message": "User profile retrieved",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "customer",
      "isEmailVerified": false,
      "isActive": true,
      "lastLoginAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-10T08:15:00Z"
    }
  }
}
```

### Password Reset Flow

```javascript
// Step 1: Request reset
POST /auth/request-password-reset
{
  "email": "john@example.com"
}

// Step 2: Reset password with token
POST /auth/reset-password
{
  "token": "a1b2c3d4e5f6...",
  "newPassword": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

---

## Environment Variables

Create `.env` file with the following variables:

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/couture_auth

# JWT Secrets (IMPORTANT: Change these in production!)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_min_32_chars
JWT_EXPIRATION=24h
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this_in_production_min_32_chars
JWT_REFRESH_EXPIRATION=7d

# Password Reset
PASSWORD_RESET_TOKEN_EXPIRATION=30m

# Email (for password reset notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Security
BCRYPT_ROUNDS=10

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Security Best Practices

### DO ✓
- Use strong JWT secrets (minimum 32 characters, random)
- Hash all passwords with bcrypt
- Validate all inputs server-side
- Use HTTPS in production
- Store tokens securely (httpOnly cookies preferred)
- Implement rate limiting on endpoints
- Monitor failed login attempts
- Use environment variables for secrets
- Implement proper CORS configuration
- Log security events

### DON'T ✗
- Store passwords in plain text
- Hardcode secrets in source code
- Trust frontend validation alone
- Skip token expiration
- Expose sensitive data in responses
- Allow unlimited login attempts
- Mix authentication logic with business logic
- Commit `.env` to version control
- Use weak password requirements
- Ignore security headers

---

## Dependencies

```json
{
  "express": "^4.18.2",           // Web framework
  "mongoose": "^7.0.0",            // MongoDB ODM
  "bcryptjs": "^2.4.3",            // Password hashing
  "jsonwebtoken": "^9.0.0",        // JWT tokens
  "dotenv": "^16.0.3",             // Environment variables
  "express-validator": "^7.0.0",   // Input validation
  "cors": "^2.8.5"                 // CORS middleware
}
```

---

## File Descriptions

### [src/models/User.js](src/models/User.js)
MongoDB User schema with:
- User profile fields (firstName, lastName, email)
- Password hashing with bcryptjs
- Password reset token management
- Login attempt tracking and account lockout
- Role-based access (customer, admin)

### [src/services/AuthService.js](src/services/AuthService.js)
Business logic for:
- User registration
- Login with validation
- Token generation and refresh
- Password reset request and reset
- JWT token management

### [src/controllers/AuthController.js](src/controllers/AuthController.js)
HTTP request handlers for:
- Registration endpoint
- Login endpoint
- Logout endpoint
- Token refresh
- Profile management
- Password operations

### [src/middleware/auth.js](src/middleware/auth.js)
Authentication middleware:
- JWT verification
- Role-based access control
- Optional authentication
- Error handling

### [src/middleware/validation.js](src/middleware/validation.js)
Input validation:
- Registration validation
- Login validation
- Password reset validation
- Error formatting

### [src/routes/auth.js](src/routes/auth.js)
Authentication API routes:
- Public endpoints (register, login, reset)
- Protected endpoints (profile, change password)

---

## Architecture

### Request Flow

```
Client Request
    ↓
Express Middleware (CORS, Body Parser)
    ↓
Validation Middleware
    ↓
Authentication Middleware (if protected route)
    ↓
Role Check Middleware (if role-based route)
    ↓
Controller Handler
    ↓
Service Layer (Business Logic)
    ↓
Mongoose Model (Database Operations)
    ↓
MongoDB Database
    ↓
Response → Client
```

### Authentication Flow

```
1. Registration
   ├── Validate input
   ├── Hash password with bcrypt
   ├── Create user in database
   └── Return access & refresh tokens

2. Login
   ├── Validate email/password
   ├── Check account status
   ├── Compare passwords
   ├── Update last login
   └── Return tokens

3. Protected Request
   ├── Extract token from header
   ├── Verify JWT signature
   ├── Check expiration
   ├── Fetch user from database
   └── Allow/Deny request

4. Password Reset
   ├── Generate secure token
   ├── Send to user (email)
   ├── Validate token on reset
   ├── Hash new password
   └── Mark token as used
```

---

## Testing

### Using cURL

#### Register
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":"John",
    "lastName":"Doe",
    "email":"john@example.com",
    "password":"SecurePass123!",
    "confirmPassword":"SecurePass123!"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"john@example.com",
    "password":"SecurePass123!"
  }'
```

#### Get Current User
```bash
curl -X GET http://localhost:5000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

Import the provided Postman collection (if included) or create:
1. Create new collection "Couture Auth"
2. Add requests for each endpoint
3. Set environment variables for `token` and `baseUrl`
4. Use tests tab to automatically capture tokens

---

## Extending the System

### Adding Email Notifications
```bash
npm install nodemailer
```

Implement in `AuthService.requestPasswordReset()`:
```javascript
const mailer = require('nodemailer');
// Send password reset email with token
```

### Adding 2FA (Two-Factor Authentication)
```bash
npm install speakeasy qrcode
```

Add to User model:
```javascript
twoFactorEnabled: Boolean,
twoFactorSecret: String
```

### Adding API Keys for Integrations
```javascript
const apiKey = crypto.randomBytes(32).toString('hex');
// Store hashed in database
// Use for third-party integrations
```

### Adding OAuth (Google, GitHub)
```bash
npm install passport passport-google-oauth20
```

---

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Ensure MongoDB is running. Start with `mongod`

### Invalid JWT Token
```
code: "AUTH_INVALID_TOKEN"
```
**Solution:** Verify token hasn't expired, JWT_SECRET is correct

### Password Hashing Takes Too Long
**Solution:** Reduce `BCRYPT_ROUNDS` in production (10 is recommended)

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:** Add your frontend domain to `CORS_ORIGIN` in `.env`

### Account Locked
```
code: "ACCOUNT_LOCKED"
```
**Solution:** User must wait 2 hours before attempting login again

---

## Performance Optimization

### Database Indexing
- Email field already indexed for fast lookups
- Add indexes for role-based queries if needed

### Caching
- Implement Redis for token blacklisting
- Cache user permissions for role checks

### Rate Limiting
- Implement per-endpoint rate limiting
- Consider Redis-based rate limiting

---

## Monitoring & Logging

### Important Events to Log
- User registration
- Login (successful/failed)
- Failed login attempts
- Account lockout
- Password resets
- Token validation failures
- Role changes

### Suggested Monitoring Tools
- Winston (logging)
- Morgan (HTTP request logging)
- Sentry (error tracking)
- ELK Stack (logging aggregation)

---

## Production Deployment

### Pre-Deployment Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Generate strong secrets
- [ ] Use HTTPS only
- [ ] Configure MongoDB securely
- [ ] Set up email service
- [ ] Enable request logging
- [ ] Configure monitoring
- [ ] Review all error messages
- [ ] Test all workflows
- [ ] Setup automated backups

### Deployment Options
- Heroku (free tier available)
- AWS Lambda + API Gateway
- Google Cloud Run
- DigitalOcean
- Vercel (for serverless)

---

## Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## License

MIT License - See LICENSE file for details

---

## Support

For issues, questions, or security concerns:
- Create GitHub Issue
- Email: support@couture-supplies.com
- Security: security@couture-supplies.com

---

## Changelog

### v1.0.0 (2024-01-15)
- Initial release
- User registration and login
- JWT authentication
- Password reset
- Role-based access control
- Account lockout mechanism

---

## Security

For security vulnerabilities, please email security@couture-supplies.com instead of using issue tracker.

---

**Built with ❤️ for Couture Supplies E-Commerce Platform**

Last Updated: 2024-01-15
