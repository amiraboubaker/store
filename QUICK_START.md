# Quick Start & Testing Guide

## Quick Reference

### API Base URL
- Development: `http://localhost:5000`
- Production: `https://api.couture-supplies.com`

### Key Endpoints
```
POST   /auth/register              - Create new account
POST   /auth/login                 - Login and get tokens
POST   /auth/logout                - Logout
GET    /auth/me                    - Get current user
PUT    /auth/profile               - Update profile
POST   /auth/change-password       - Change password
POST   /auth/request-password-reset - Request password reset
POST   /auth/reset-password        - Reset password
POST   /auth/refresh               - Refresh access token
```

---

## Setup (5 Minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Create .env File
```bash
cp .env.example .env
```

### 3. Edit .env with your values
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/couture_auth
JWT_SECRET=your_32_character_minimum_secret_key_here
```

### 4. Start MongoDB (if local)
```bash
mongod
```

### 5. Start Server
```bash
npm run dev
```

### 6. Test it works
```bash
curl http://localhost:5000/health
```

---

## Testing with cURL

### 1. Register New User
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

**Expected Response (201):**
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
      "email": "john@example.com",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2. Login User
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response (200):**
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
      "email": "john@example.com",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

💡 **Save the token** - you'll need it for protected routes!

---

### 3. Get Current User Profile
```bash
export TOKEN="your_token_here"

curl -X GET http://localhost:5000/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200):**
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

---

### 4. Update Profile
```bash
curl -X PUT http://localhost:5000/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith"
  }'
```

**Expected Response (200):**
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
      "email": "john@example.com",
      "role": "customer"
    }
  }
}
```

---

### 5. Change Password
```bash
curl -X POST http://localhost:5000/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "oldPassword": "SecurePass123!",
    "newPassword": "NewSecurePass456!",
    "confirmPassword": "NewSecurePass456!"
  }'
```

**Expected Response (200):**
```json
{
  "status": "success",
  "code": "PASSWORD_CHANGED",
  "message": "Password changed successfully",
  "data": null
}
```

---

### 6. Request Password Reset
```bash
curl -X POST http://localhost:5000/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

**Expected Response (200) - Development Mode:**
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

---

### 7. Reset Password
```bash
curl -X POST http://localhost:5000/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0...",
    "newPassword": "AnotherSecurePass789!",
    "confirmPassword": "AnotherSecurePass789!"
  }'
```

**Expected Response (200):**
```json
{
  "status": "success",
  "code": "PASSWORD_RESET_SUCCESS",
  "message": "Password has been reset successfully",
  "data": null
}
```

---

### 8. Refresh Access Token
```bash
curl -X POST http://localhost:5000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token_here"
  }'
```

**Expected Response (200):**
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
      "email": "john@example.com",
      "role": "customer"
    }
  }
}
```

---

### 9. Logout
```bash
curl -X POST http://localhost:5000/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200):**
```json
{
  "status": "success",
  "code": "LOGOUT_SUCCESS",
  "message": "Logged out successfully",
  "data": null
}
```

---

## Error Examples

### Invalid Credentials
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "WrongPassword123!"
  }'
```

**Response (401):**
```json
{
  "status": "error",
  "code": "INVALID_CREDENTIALS",
  "message": "Invalid email or password",
  "data": null
}
```

### Missing Token
```bash
curl -X GET http://localhost:5000/auth/me
```

**Response (401):**
```json
{
  "status": "error",
  "code": "AUTH_MISSING_TOKEN",
  "message": "Access token is missing",
  "data": null
}
```

### Validation Error (Weak Password)
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "weak",
    "confirmPassword": "weak"
  }'
```

**Response (400):**
```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "data": {
    "errors": {
      "password": "Password must be at least 8 characters"
    }
  }
}
```

### Account Already Exists
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!"
  }'
```

**Response (400):**
```json
{
  "status": "error",
  "code": "USER_ALREADY_EXISTS",
  "message": "Email is already registered",
  "data": null
}
```

### Expired Token
```bash
curl -X GET http://localhost:5000/auth/me \
  -H "Authorization: Bearer expired.token.here"
```

**Response (401):**
```json
{
  "status": "error",
  "code": "AUTH_TOKEN_EXPIRED",
  "message": "Access token has expired",
  "data": null
}
```

---

## Advanced Testing

### Using Postman

1. **Create new collection:** "Couture Auth API"
2. **Create environment variables:**
   - `baseUrl`: `http://localhost:5000`
   - `token`: (captured from login)
   - `refreshToken`: (captured from login)

3. **Set up tests to auto-capture token:**
   ```javascript
   // In Tests tab of login request
   if (pm.response.code === 200) {
     pm.environment.set("token", pm.response.json().data.token);
     pm.environment.set("refreshToken", pm.response.json().data.refreshToken);
   }
   ```

### Using Thunder Client (VS Code)

1. Install "Thunder Client" extension
2. Create requests for each endpoint
3. Use environment variables for `token`

### Using Insomnia

1. Create new workspace
2. Import requests from `API_ROUTES.md`
3. Set up JWT Auth token in headers

---

## Performance Testing

### Load Testing with Apache Bench
```bash
# Install: apt-get install apache2-utils (Linux) or brew install httpd (Mac)

# Test login endpoint
ab -n 1000 -c 100 -p payload.json \
  -T application/json \
  http://localhost:5000/auth/login
```

### Load Testing with Artillery
```bash
npm install -g artillery

# artillery quick --count 100 --num 1000 http://localhost:5000/auth/me
```

---

## Debugging Tips

### Enable Detailed Logging
```bash
# In .env
NODE_ENV=development
LOG_LEVEL=debug
```

### Check MongoDB Connection
```bash
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✓ Connected'))
  .catch(e => console.log('✗ Error:', e.message));
"
```

### Verify JWT Token
```bash
node -e "
const jwt = require('jsonwebtoken');
const token = 'your_token_here';
try {
  const decoded = jwt.decode(token);
  console.log(JSON.stringify(decoded, null, 2));
} catch(e) {
  console.log('Invalid token:', e.message);
}
"
```

### Check Environment Variables
```bash
node -e "console.log(process.env.JWT_SECRET ? '✓ JWT_SECRET set' : '✗ JWT_SECRET missing')"
```

---

## Common Issues & Solutions

### "Cannot connect to MongoDB"
```bash
# Check if MongoDB is running
# Linux: sudo systemctl status mongod
# Mac: brew services list
# Windows: Check Services in Task Manager

# Start MongoDB if not running
mongod
```

### "JWT_SECRET is not set"
```bash
# Add to .env file:
JWT_SECRET=generate_with_crypto_random_bytes_32
```

### "Port 5000 already in use"
```bash
# Find process using port 5000
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows

# Kill process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows

# Or use different port
PORT=5001 npm run dev
```

### "Invalid token" errors after restart
- Tokens are tied to JWT_SECRET
- If JWT_SECRET changes, all existing tokens become invalid
- This is expected behavior

---

## Next Steps

1. ✅ **Test all endpoints** using provided curl commands
2. ✅ **Review security documentation** in `SECURITY.md`
3. ✅ **Integrate with frontend** using token-based auth
4. ✅ **Setup monitoring** before production
5. ✅ **Configure email service** for password resets
6. ✅ **Create backup strategy** for MongoDB
7. ✅ **Deploy to production** following `DEPLOYMENT.md`

---

## Need Help?

📖 See full API documentation: [API_ROUTES.md](API_ROUTES.md)
🔒 Security details: [SECURITY.md](SECURITY.md)
🚀 Deployment guide: [DEPLOYMENT.md](DEPLOYMENT.md)
📚 Setup instructions: [README.md](README.md)

---

**Happy testing! 🎉**
