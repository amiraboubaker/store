# Authentication API Documentation

## Base URL
```
http://localhost:5000
```

## Response Format
All API responses follow a standardized format:

```json
{
  "status": "success|error",
  "code": "OPERATION_CODE",
  "message": "Human-readable message",
  "data": {}
}
```

---

## Authentication Endpoints

### 1. User Registration
**Endpoint:** `POST /auth/register`

**Description:** Register a new user account

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one digit (0-9)
- At least one special character (@$!%*?&)

**Success Response (201 Created):**
```json
{
  "status": "success",
  "code": "USER_REGISTERED",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "data": {
    "errors": {
      "email": "Please provide a valid email address",
      "password": "Password must contain at least one special character (@$!%*?&)"
    }
  }
}
```

---

### 2. User Login
**Endpoint:** `POST /auth/login`

**Description:** Authenticate user and receive JWT tokens

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "code": "LOGIN_SUCCESS",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response - Invalid Credentials (401 Unauthorized):**
```json
{
  "status": "error",
  "code": "INVALID_CREDENTIALS",
  "message": "Invalid email or password",
  "data": null
}
```

**Error Response - Account Locked (429 Too Many Requests):**
```json
{
  "status": "error",
  "code": "ACCOUNT_LOCKED",
  "message": "Account is temporarily locked due to too many failed login attempts. Please try again later.",
  "data": null
}
```

---

### 3. Refresh Access Token
**Endpoint:** `POST /auth/refresh`

**Description:** Get a new access token using refresh token

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "code": "TOKEN_REFRESHED",
  "message": "Token refreshed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "customer"
    }
  }
}
```

---

### 4. Request Password Reset
**Endpoint:** `POST /auth/request-password-reset`

**Description:** Request a password reset email (simulated in development)

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "code": "PASSWORD_RESET_REQUESTED",
  "message": "If email exists in our system, password reset link has been sent",
  "data": null
}
```

**Development Response (includes reset token):**
```json
{
  "status": "success",
  "code": "PASSWORD_RESET_REQUESTED",
  "message": "If email exists in our system, password reset link has been sent",
  "data": {
    "resetToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0..."
  }
}
```

> **Security Note:** In production, the resetToken should NOT be returned in the response. Instead, send it via email link: `https://app.com/reset-password?token=...`

---

### 5. Reset Password
**Endpoint:** `POST /auth/reset-password`

**Description:** Reset password using valid reset token

**Request Body:**
```json
{
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0...",
  "newPassword": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "code": "PASSWORD_RESET_SUCCESS",
  "message": "Password has been reset successfully",
  "data": null
}
```

**Error Response - Invalid/Expired Token (400 Bad Request):**
```json
{
  "status": "error",
  "code": "INVALID_RESET_TOKEN",
  "message": "Password reset token is invalid or has expired",
  "data": null
}
```

---

### 6. User Logout
**Endpoint:** `POST /auth/logout`

**Description:** Logout user (token invalidation handled client-side)

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "code": "LOGOUT_SUCCESS",
  "message": "Logged out successfully",
  "data": null
}
```

---

### 7. Get Current User Profile
**Endpoint:** `GET /auth/me`

**Description:** Retrieve current authenticated user's profile

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "code": "USER_PROFILE_RETRIEVED",
  "message": "User profile retrieved",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "customer",
      "isEmailVerified": false,
      "isActive": true,
      "lastLoginAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-10T08:15:00Z"
    }
  }
}
```

---

### 8. Update User Profile
**Endpoint:** `PUT /auth/profile`

**Description:** Update current user's profile information

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "code": "PROFILE_UPDATED",
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "john.doe@example.com",
      "role": "customer"
    }
  }
}
```

---

### 9. Change Password
**Endpoint:** `POST /auth/change-password`

**Description:** Change password (requires current password verification)

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "oldPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!",
  "confirmPassword": "NewSecurePass456!"
}
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "code": "PASSWORD_CHANGED",
  "message": "Password changed successfully",
  "data": null
}
```

**Error Response - Invalid Old Password (401 Unauthorized):**
```json
{
  "status": "error",
  "code": "INVALID_OLD_PASSWORD",
  "message": "Current password is incorrect",
  "data": null
}
```

---

## Protected Routes (Examples)

### Admin Routes

#### Get All Users
**Endpoint:** `GET /admin/users`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "code": "USERS_RETRIEVED",
  "message": "Users retrieved successfully",
  "data": {
    "users": []
  }
}
```

**Error Response - Insufficient Permissions (403 Forbidden):**
```json
{
  "status": "error",
  "code": "AUTH_INSUFFICIENT_PERMISSIONS",
  "message": "Insufficient permissions to access this resource",
  "data": {
    "requiredRoles": ["admin"],
    "userRole": "customer"
  }
}
```

#### Delete User
**Endpoint:** `DELETE /admin/users/:id`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Update User Role
**Endpoint:** `PUT /admin/users/:id/role`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "role": "admin"
}
```

---

### Customer Routes

#### Get User Orders
**Endpoint:** `GET /customer/orders`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "code": "ORDERS_RETRIEVED",
  "message": "Orders retrieved successfully",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "orders": []
  }
}
```

#### Create Order
**Endpoint:** `POST /customer/orders`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "items": [
    {
      "productId": "607f1f77bcf86cd799439012",
      "quantity": 2
    }
  ]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "status": "error",
  "code": "VALIDATION_ERROR|INVALID_RESET_TOKEN",
  "message": "Validation failed|Password reset token is invalid or has expired",
  "data": null
}
```

### 401 Unauthorized
```json
{
  "status": "error",
  "code": "AUTH_MISSING_TOKEN|AUTH_INVALID_TOKEN|INVALID_CREDENTIALS",
  "message": "Access token is missing|Invalid access token|Invalid email or password",
  "data": null
}
```

### 403 Forbidden
```json
{
  "status": "error",
  "code": "AUTH_INSUFFICIENT_PERMISSIONS",
  "message": "Insufficient permissions to access this resource",
  "data": {
    "requiredRoles": ["admin"],
    "userRole": "customer"
  }
}
```

### 429 Too Many Requests
```json
{
  "status": "error",
  "code": "ACCOUNT_LOCKED",
  "message": "Account is temporarily locked due to too many failed login attempts. Please try again later.",
  "data": null
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "code": "INTERNAL_SERVER_ERROR",
  "message": "Internal server error",
  "data": null
}
```

---

## JWT Token Structure

JWT tokens contain the following payload (decoded):

```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "john.doe@example.com",
  "role": "customer",
  "iat": 1705315800,
  "exp": 1705402200
}
```

**Token Expiration:**
- Access Token: 24 hours
- Refresh Token: 7 days

---

## Authentication Header Format

Include JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsImVtYWlsIjoiam9obi5kb2VAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3MDUzMTU4MDAsImV4cCI6MTcwNTQwMjIwMH0.signature
```

---

## Rate Limiting

- **Limit:** 100 requests per minute per IP
- **Response Code:** 429 Too Many Requests

---

## Security Best Practices

1. **Always use HTTPS** in production
2. **Store tokens securely** (httpOnly cookies preferred over localStorage)
3. **Never expose passwords** in API responses
4. **Validate all inputs** on the server side
5. **Use strong passwords** with all required complexity rules
6. **Implement token rotation** for refresh tokens
7. **Monitor failed login attempts** and lock accounts
8. **Use environment variables** for all secrets
9. **Implement CORS** properly for your domain
10. **Log security events** for audit trails

---

## Setup & Configuration

1. Create `.env` file from `.env.example`
2. Update environment variables:
   ```
   JWT_SECRET=your_32_character_minimum_secret_key
   JWT_REFRESH_SECRET=your_32_character_minimum_refresh_secret
   MONGODB_URI=mongodb://localhost:27017/couture_auth
   ```
3. Install dependencies: `npm install`
4. Start server: `npm start` or `npm run dev`
5. Access API at `http://localhost:5000`

---

## Testing with cURL

### Register User
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:5000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Request Password Reset
```bash
curl -X POST http://localhost:5000/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

---

## API Version
**v1.0.0** - Initial Release

Last Updated: 2024-01-15
