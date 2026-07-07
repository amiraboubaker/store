# Architecture & Project Structure

## Project Overview

This is a **production-ready authentication system** for an e-commerce platform, built following **clean architecture** principles with clear separation of concerns.

### Core Architecture Pattern

```
HTTP Request
    ↓
Routes (API Endpoints)
    ↓
Middleware (Validation, Auth, CORS)
    ↓
Controllers (Request Handlers)
    ↓
Services (Business Logic)
    ↓
Models (Data Schema & Validation)
    ↓
Database (MongoDB)
```

---

## Directory Structure

```
project-root/
├── src/
│   ├── index.js                    # Express app setup & server startup
│   ├── models/
│   │   └── User.js                 # MongoDB User schema
│   ├── controllers/
│   │   └── AuthController.js       # Request handlers (HTTP layer)
│   ├── services/
│   │   └── AuthService.js          # Business logic (core logic layer)
│   ├── middleware/
│   │   ├── auth.js                 # JWT verification & role-based access
│   │   └── validation.js           # Input validation & sanitization
│   ├── routes/
│   │   ├── auth.js                 # Authentication endpoints
│   │   └── protected.example.js    # Protected route examples
│   └── tests/
│       └── auth.test.example.js    # Unit & integration tests
├── .env.example                    # Environment variables template
├── .env                            # Actual secrets (git ignored)
├── .gitignore                      # Git ignore rules
├── package.json                    # Dependencies & scripts
├── README.md                       # Project documentation
├── API_ROUTES.md                   # API endpoint documentation
├── SECURITY.md                     # Security implementation details
├── DEPLOYMENT.md                   # Production deployment guide
├── QUICK_START.md                  # Quick reference & testing
└── LICENSE                         # MIT License
```

---

## Layer Descriptions

### 1. Routes Layer (`src/routes/`)

**Purpose:** Define API endpoints and map HTTP requests to controllers

**Responsibility:**
- Define HTTP methods (GET, POST, PUT, DELETE)
- Map URL paths to controller functions
- Apply middleware (validation, authentication)
- Document endpoint parameters

**Example:**
```javascript
// src/routes/auth.js
router.post(
  '/register',
  validateRegistration,      // Middleware
  handleValidationErrors,    // Middleware
  AuthController.register    // Handler
);
```

**Key Characteristics:**
- Thin layer (mostly declarative)
- No business logic
- Pure routing configuration

---

### 2. Middleware Layer (`src/middleware/`)

**Includes:**
- **auth.js** - JWT verification, role-based access control
- **validation.js** - Input validation using express-validator

**auth.js Responsibilities:**
- Extract and verify JWT tokens
- Attach user to request object
- Check role-based permissions
- Handle authentication errors

**validation.js Responsibilities:**
- Validate input format (email, password, etc.)
- Sanitize user inputs
- Return structured validation errors

**Key Characteristics:**
- Executes before controller
- Reusable across multiple routes
- Can chain multiple middleware

---

### 3. Controller Layer (`src/controllers/AuthController.js`)

**Purpose:** Handle HTTP request/response logic

**Responsibilities:**
- Receive HTTP request
- Extract request data (body, params, headers)
- Call service layer with extracted data
- Format response according to API spec
- Handle and format errors

**Example:**
```javascript
static async register(req, res, next) {
  try {
    const { firstName, lastName, email, password } = req.body;
    const result = await AuthService.register({...});
    res.status(201).json({...});
  } catch (error) {
    next(error);
  }
}
```

**Key Characteristics:**
- Contains HTTP-specific logic only
- No database queries directly
- Always use try-catch for async operations
- Delegates business logic to services

---

### 4. Service Layer (`src/services/AuthService.js`)

**Purpose:** Contain all business logic and domain rules

**Responsibilities:**
- Implement authentication logic
- Validate business rules
- Coordinate between multiple operations
- Generate and manage tokens
- Handle password hashing
- Implement access control rules

**Example:**
```javascript
static async login(email, password) {
  // Business logic:
  // 1. Validate input
  // 2. Find user
  // 3. Check account status
  // 4. Verify password
  // 5. Update last login
  // 6. Generate tokens
  // 7. Return result
}
```

**Key Characteristics:**
- Pure business logic (no HTTP concerns)
- Testable and reusable
- Can be called from multiple controllers
- Framework-agnostic

---

### 5. Model Layer (`src/models/User.js`)

**Purpose:** Define data structure and database schema

**Responsibilities:**
- Define field types and validations
- Implement pre/post hooks
- Define instance methods (matchPassword, getResetToken)
- Define static methods (findByEmail)
- Create database indexes
- Enforce data integrity

**Example:**
```javascript
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  // Hash password before saving
  const salt = await bcryptjs.genSalt(10);
  this.password = await bcryptjs.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};
```

**Key Characteristics:**
- Single source of truth for data structure
- Hooks for automatic processing
- Helper methods for common operations
- Database optimization through indexes

---

### 6. Database Layer (MongoDB)

**Purpose:** Persistent data storage

**Characteristics:**
- Document-based (NoSQL)
- Flexible schema (though we enforce it via Mongoose)
- Horizontal scalability
- Strong consistency with transactions (v4.0+)

---

## Data Flow Examples

### Example 1: User Registration

```
Client
  └─ POST /auth/register
       │
       └─ Routes Layer
            ├─ Validation Middleware (validateRegistration)
            ├─ Validation Error Handler (handleValidationErrors)
            └─ AuthController.register()
                 │
                 └─ Services Layer
                      └─ AuthService.register()
                           ├─ Check if user exists
                           ├─ Create new User instance
                           ├─ Pre-save hook (hash password)
                           ├─ Save to database
                           ├─ Generate JWT token
                           └─ Return user + tokens
                 │
                 └─ Controller formats response
                      └─ Send 201 + JSON response
                           │
                           └─ Client receives token
```

**Data transformations:**
```
Input: { email, password, firstName, lastName }
  ↓
Validation: Check format, strength, etc.
  ↓
Service: Create user, hash password, generate token
  ↓
Database: Store user with hashed password
  ↓
Output: { user, token, refreshToken }
```

---

### Example 2: Protected Request (Get User Profile)

```
Client with Token
  └─ GET /auth/me with "Authorization: Bearer token"
       │
       └─ Routes Layer
            ├─ Auth Middleware (verify JWT)
            │    ├─ Extract token from header
            │    ├─ Verify signature
            │    ├─ Check expiration
            │    ├─ Fetch user from DB
            │    └─ Attach user to req.user
            │
            └─ AuthController.getCurrentUser()
                 ├─ Access req.user (already authenticated)
                 ├─ Format user response
                 └─ Send 200 + user data
                      │
                      └─ Client receives profile
```

**Security checks:**
- Token exists and valid
- Token signature correct
- Token not expired
- User exists in database
- User is active

---

### Example 3: Password Reset Flow

```
Step 1: Request Reset
Client
  └─ POST /auth/request-password-reset { email }
       │
       └─ Service generates secure token
       └─ Saves hashed token to database
       └─ Returns token (dev mode only)

Step 2: Reset Password (after user receives token)
Client
  └─ POST /auth/reset-password { token, newPassword }
       │
       └─ Service validates token
            ├─ Hash provided token
            ├─ Compare with stored hash
            ├─ Check expiration (30 min)
            ├─ Check not already used
            ├─ Hash new password
            ├─ Update user password
            ├─ Mark token as used
            └─ Return success
```

**Security features:**
- Token is hashed before storage
- Token has time expiration
- Token can only be used once
- New password is hashed with bcrypt

---

## Design Patterns Used

### 1. MVC (Model-View-Controller)
- **Model:** User schema
- **View:** JSON API responses
- **Controller:** AuthController

### 2. Service Layer Pattern
- Separates business logic from HTTP concerns
- Enables reusability and testability

### 3. Middleware Pattern
- Composable request processing
- Concerns like validation, auth, error handling

### 4. Repository Pattern (implicit via Mongoose)
- Single source for database queries
- Models act as repositories

### 5. Factory Pattern
- AuthService methods create tokens
- Controllers create responses

### 6. Decorator Pattern
- Middleware decorates route handlers
- Pre/post hooks decorate model operations

---

## Dependency Injection

The system uses **constructor/parameter-based injection**:

```javascript
// Services don't directly depend on framework
class AuthService {
  static async register(userData) {
    // Pure logic, no Express/Mongoose import needed
    // Can be tested in isolation
  }
}

// Controllers receive request/response
const login = (req, res, next) => {
  // req, res injected by Express
  // next injected for error handling
};

// Middleware receives req, res, next
const auth = (req, res, next) => {
  // req, res, next injected by Express
};
```

---

## Error Handling Strategy

### Levels of Error Handling

```
1. Input Level
   └─ Validation middleware
   └─ Returns 400 Bad Request

2. Business Logic Level
   └─ Service layer throws custom errors
   └─ Controller catches and formats

3. Authentication Level
   └─ Auth middleware catches JWT errors
   └─ Returns 401 Unauthorized

4. Authorization Level
   └─ Role middleware checks permissions
   └─ Returns 403 Forbidden

5. Database Level
   └─ Mongoose validates schemas
   └─ Catches duplicate key, etc.

6. Server Level
   └─ Global error handler
   └─ Returns 500 Internal Server Error
```

### Error Response Format

```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "Human-readable message",
  "data": null
}
```

---

## Testability

### Unit Testing (Service Layer)
```javascript
describe('AuthService', () => {
  it('should register new user', async () => {
    const result = await AuthService.register({...});
    expect(result.user.email).toBe('test@example.com');
  });
});
```

Services are testable because they're framework-agnostic.

### Integration Testing (Full Flow)
```javascript
describe('POST /auth/register', () => {
  it('should register user and return tokens', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({...});
    expect(res.statusCode).toBe(201);
  });
});
```

Full flows testable through routes.

---

## Scalability Considerations

### Horizontal Scaling
- Stateless design (JWT tokens)
- No session storage on server
- Can run multiple instances behind load balancer

### Vertical Scaling
- Database indexes for fast queries
- Caching layer for user data
- Connection pooling for MongoDB

### Performance
- Lazy load middleware only where needed
- Use `.lean()` for read-only queries
- Cache tokens using Redis (optional)

---

## Security by Layer

| Layer | Security Measures |
|-------|-------------------|
| Routes | CORS validation, method validation |
| Middleware | Input validation, JWT verification, rate limiting |
| Controllers | Error message sanitization, response formatting |
| Services | Business rule enforcement, token generation |
| Models | Field validation, type checking, hashing hooks |
| Database | Indexes for security queries, access control |

---

## Adding New Features

### Example: Add Email Verification

1. **Model:** Add `emailVerificationToken` field
   ```javascript
   emailVerificationToken: { type: String, select: false }
   emailVerificationExpires: { type: Date, select: false }
   ```

2. **Service:** Add method to generate and verify token
   ```javascript
   static generateEmailVerificationToken() { ... }
   static verifyEmail(token) { ... }
   ```

3. **Controller:** Add endpoint handler
   ```javascript
   static async verifyEmail(req, res) { ... }
   ```

4. **Routes:** Add route
   ```javascript
   router.post('/verify-email', AuthController.verifyEmail);
   ```

5. **Middleware:** Update registration validation if needed

6. **Tests:** Add test cases

---

## Configuration Management

All configuration via environment variables:
```
.env (secret) ← gitignored
.env.example (template) ← committed

process.env.JWT_SECRET
process.env.MONGODB_URI
process.env.NODE_ENV
```

Never hardcode secrets or environment-specific values.

---

## Monitoring & Debugging

### Request Logging
```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

### Error Tracking
```javascript
logger.error('Database error', { error, userId, requestId });
```

### Performance Monitoring
```javascript
console.time('password-hash');
// ... bcrypt operation
console.timeEnd('password-hash');
```

---

## Extending the Architecture

### Add Admin Module
1. Create `src/controllers/AdminController.js`
2. Create `src/services/AdminService.js`
3. Create `src/routes/admin.js`
4. Add role middleware to routes
5. Test thoroughly

### Add Email Service
1. Create `src/services/EmailService.js`
2. Inject into AuthService where needed
3. Add email configuration to .env
4. Test with Nodemailer or SendGrid

### Add Audit Logging
1. Create `src/models/AuditLog.js`
2. Create `src/services/AuditService.js`
3. Call from controllers for important actions
4. Add queries to retrieve audit trails

---

## Best Practices Summary

✅ **DO:**
- Keep layers separated
- Use services for business logic
- Put HTTP concerns in controllers
- Validate all inputs
- Use environment variables for config
- Write tests for critical paths
- Log important events
- Handle errors gracefully

❌ **DON'T:**
- Put business logic in controllers
- Query database directly in controllers
- Mix concerns across layers
- Hardcode secrets
- Ignore validation
- Use console.log for errors
- Return sensitive data in responses
- Skip error handling

---

**This architecture ensures maintainability, testability, scalability, and security!**
