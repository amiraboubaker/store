# Production Deployment & Advanced Security Guide

## Table of Contents
1. Pre-Deployment Checklist
2. Environment Configuration
3. Database Security
4. API Security Enhancements
5. Monitoring & Logging
6. Backup & Recovery
7. Scalability Considerations
8. Performance Optimization

---

## 1. Pre-Deployment Checklist

### Code & Configuration
- [ ] Remove all `console.log` statements for debugging
- [ ] Set `NODE_ENV=production`
- [ ] Generate cryptographically secure secrets
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] Review all error messages (no stack traces in production)
- [ ] Enable HTTPS only
- [ ] Configure proper CORS for your domain
- [ ] Review all API responses for sensitive data

### Security Headers
- [ ] Add `helmet` middleware for HTTP headers
- [ ] Set `X-Content-Type-Options: nosniff`
- [ ] Set `X-Frame-Options: DENY`
- [ ] Set `X-XSS-Protection: 1; mode=block`
- [ ] Add `Strict-Transport-Security` header

### Database
- [ ] Create strong MongoDB root password
- [ ] Enable authentication on MongoDB
- [ ] Use TLS/SSL for database connections
- [ ] Setup database backups (automated daily)
- [ ] Test backup recovery process
- [ ] Create separate read-only user for analytics

### Deployment Infrastructure
- [ ] Setup HTTPS certificates (Let's Encrypt free)
- [ ] Configure firewall rules
- [ ] Setup DDoS protection
- [ ] Enable WAF (Web Application Firewall)
- [ ] Configure rate limiting at load balancer level
- [ ] Setup auto-scaling if using cloud

### Monitoring & Logging
- [ ] Setup error tracking (Sentry)
- [ ] Configure centralized logging (ELK Stack)
- [ ] Setup performance monitoring (New Relic, DataDog)
- [ ] Configure alerts for failures
- [ ] Setup uptime monitoring

---

## 2. Environment Configuration

### Production .env Template
```bash
# Server
NODE_ENV=production
PORT=5000

# Database - Use connection string from MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/couture_auth?retryWrites=true&w=majority

# JWT - Generate strong secrets (32+ characters minimum)
JWT_SECRET=generate_with_crypto_random_bytes_32
JWT_EXPIRATION=24h
JWT_REFRESH_SECRET=generate_with_crypto_random_bytes_32
JWT_REFRESH_EXPIRATION=7d

# Password Reset
PASSWORD_RESET_TOKEN_EXPIRATION=30m

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@couture-supplies.com
EMAIL_PASSWORD=use_app_specific_password
EMAIL_FROM=noreply@couture-supplies.com

# Security
BCRYPT_ROUNDS=10

# CORS - Specify exact domains
CORS_ORIGIN=https://app.couture-supplies.com,https://www.couture-supplies.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info

# API Keys
SENDGRID_API_KEY=your_sendgrid_key
STRIPE_SECRET_KEY=your_stripe_key
```

### Secret Management Best Practices

#### AWS Secrets Manager
```bash
aws secretsmanager create-secret \
  --name couture/jwt-secret \
  --secret-string "your-secret-value"
```

#### HashiCorp Vault
```hcl
vault write secret/data/couture/jwt \
  secret="your-secret-value"
```

#### Kubernetes Secrets
```bash
kubectl create secret generic couture-auth \
  --from-literal=jwt-secret=value \
  --from-literal=jwt-refresh-secret=value
```

---

## 3. Database Security

### MongoDB Atlas Setup
```javascript
// Connection URI with authentication
mongodb+srv://admin:password@cluster.mongodb.net/couture_auth?
  retryWrites=true&
  w=majority&
  ssl=true&
  authSource=admin
```

### Enable Authentication
```javascript
// Create root user
use admin
db.createUser({
  user: "admin",
  pwd: passwordPrompt(),
  roles: ["root"]
})

// Create application user (limited privileges)
db.createUser({
  user: "app_user",
  pwd: passwordPrompt(),
  roles: [
    { role: "readWrite", db: "couture_auth" }
  ]
})
```

### Encryption at Rest
```javascript
// MongoDB Enterprise: Enable encryption at rest
// MongoDB Atlas: Automatically enabled
// Self-hosted: Use mongod with --encryptionKeyFile option
```

### Encryption in Transit
```javascript
// Use TLS/SSL connections
const uri = "mongodb+srv://user:pass@cluster.mongodb.net/?ssl=true";
```

### Database Backups
```bash
# Automated backups with MongoDB Atlas
# Manual backup with mongodump
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/couture_auth" \
  --out ./backup/$(date +%Y%m%d_%H%M%S)

# Restore
mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net" \
  ./backup/20240115_120000/couture_auth
```

---

## 4. API Security Enhancements

### Add Helmet for Security Headers
```bash
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());

// Additional header configuration
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"]
  }
}));

app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true
}));
```

### Implement Rate Limiting
```bash
npm install express-rate-limit redis
```

```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const client = redis.createClient();

const loginLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    prefix: 'login-limit:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later'
});

app.post('/auth/login', loginLimiter, AuthController.login);
```

### Add Request ID Tracking
```javascript
const { v4: uuidv4 } = require('uuid');

app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.set('X-Request-ID', req.id);
  next();
});
```

### Implement Request Signing
```javascript
// For API integrations
const crypto = require('crypto');

function signRequest(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

// Verify in middleware
function verifySignature(req, res, next) {
  const signature = req.headers['x-signature'];
  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', process.env.API_SECRET)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid request signature'
    });
  }
  next();
}
```

### Implement API Key System
```javascript
// User model extension
const userSchema = new Schema({
  // ... existing fields
  apiKeys: [{
    key: String, // hashed
    name: String,
    lastUsed: Date,
    createdAt: { type: Date, default: Date.now }
  }]
});

// API Key middleware
async function apiKeyMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      code: 'MISSING_API_KEY',
      message: 'API key is required'
    });
  }

  const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
  const user = await User.findOne({ 'apiKeys.key': hashedKey });

  if (!user) {
    return res.status(401).json({
      code: 'INVALID_API_KEY',
      message: 'Invalid API key'
    });
  }

  req.user = user;
  next();
}
```

---

## 5. Monitoring & Logging

### Winston Logger Setup
```bash
npm install winston winston-daily-rotate-file
```

```javascript
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'auth-api' },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Daily rotate file
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxDays: '14d'
    }),
    // Error file
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxDays: '30d'
    })
  ]
});

module.exports = logger;
```

### Sentry Error Tracking
```bash
npm install @sentry/node @sentry/tracing
```

```javascript
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({ app: true, request: true })
  ]
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// At the end, after all routes
app.use(Sentry.Handlers.errorHandler());
```

### Security Events Logging
```javascript
// Log all security-relevant events
logger.info('User registration', {
  email: user.email,
  timestamp: new Date(),
  requestId: req.id
});

logger.warn('Failed login attempt', {
  email: email,
  attempts: loginAttempts,
  ipAddress: req.ip,
  requestId: req.id
});

logger.error('Password reset requested', {
  email: email,
  tokenExpiry: resetExpires,
  requestId: req.id
});

logger.info('Unauthorized access attempt', {
  requiredRole: 'admin',
  userRole: user.role,
  endpoint: req.path,
  requestId: req.id
});
```

---

## 6. Backup & Recovery

### Automated Backup Strategy

```bash
#!/bin/bash
# backup-mongo.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb/$TIMESTAMP"
ARCHIVE="$BACKUP_DIR.tar.gz"

# Create backup
mongodump --uri "$MONGODB_URI" --out "$BACKUP_DIR"

# Compress
tar -czf "$ARCHIVE" -C "/backups/mongodb" "$TIMESTAMP"

# Upload to S3
aws s3 cp "$ARCHIVE" "s3://couture-backups/mongodb/"

# Keep only last 30 days
find /backups/mongodb -type f -name "*.tar.gz" -mtime +30 -delete

# Send notification
echo "Backup completed: $ARCHIVE" | mail -s "MongoDB Backup" ops@couture-supplies.com
```

### Recovery Procedures

```bash
# List available backups
aws s3 ls s3://couture-backups/mongodb/

# Download backup
aws s3 cp s3://couture-backups/mongodb/20240115_120000.tar.gz .

# Extract
tar -xzf 20240115_120000.tar.gz

# Restore
mongorestore --uri "$MONGODB_URI" ./20240115_120000/
```

---

## 7. Scalability Considerations

### Horizontal Scaling

```javascript
// Use PM2 for process management
// pm2.config.js
module.exports = {
  apps: [{
    name: 'auth-api',
    script: './src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

```bash
npm install -g pm2
pm2 start pm2.config.js
```

### Load Balancing with Nginx

```nginx
upstream auth_api {
  least_conn;
  server 127.0.0.1:5001;
  server 127.0.0.1:5002;
  server 127.0.0.1:5003;
  server 127.0.0.1:5004;
}

server {
  listen 443 ssl http2;
  server_name api.couture-supplies.com;

  ssl_certificate /etc/letsencrypt/live/couture-supplies.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/couture-supplies.com/privkey.pem;

  # Security headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;

  # Rate limiting
  limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
  limit_req zone=api_limit burst=20 nodelay;

  location / {
    proxy_pass http://auth_api;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Request-ID $request_id;
  }
}
```

### Database Replication

```javascript
// MongoDB Replica Set Configuration
// For high availability

rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "primary.mongodb.net:27017" },
    { _id: 1, host: "secondary1.mongodb.net:27017" },
    { _id: 2, host: "secondary2.mongodb.net:27017" }
  ]
});
```

---

## 8. Performance Optimization

### Caching Strategy

```bash
npm install redis
```

```javascript
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

// Cache user profile
async function getUserProfile(userId) {
  const cached = await client.get(`user:${userId}`);
  
  if (cached) {
    return JSON.parse(cached);
  }

  const user = await User.findById(userId);
  await client.setex(`user:${userId}`, 3600, JSON.stringify(user));
  
  return user;
}

// Invalidate cache on update
app.put('/auth/profile', authMiddleware, async (req, res) => {
  // ... update user
  await client.del(`user:${req.user._id}`);
  // ... send response
});
```

### Database Query Optimization

```javascript
// Create indexes for frequently queried fields
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: -1 });

// Use lean() for read-only queries
const users = await User.find().lean(); // Skip Mongoose overhead

// Select only needed fields
const user = await User.findById(id).select('firstName lastName email role');

// Use aggregation for complex queries
const stats = await User.aggregate([
  { $match: { role: 'customer' } },
  { $group: { _id: null, count: { $sum: 1 } } }
]);
```

### API Response Caching

```javascript
// Cache GET responses
app.get('/auth/me', authMiddleware, (req, res) => {
  res.set('Cache-Control', 'private, max-age=300'); // 5 minutes
  // ... send user profile
});

// Don't cache sensitive operations
app.post('/auth/login', (req, res) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  // ... handle login
});
```

### Compression

```javascript
const compression = require('compression');
app.use(compression());
```

---

## Deployment Checklist Summary

### Final Verification
- [ ] All tests passing
- [ ] No sensitive data in logs
- [ ] SSL/TLS certificates valid
- [ ] Database backups working
- [ ] Monitoring alerts configured
- [ ] Rate limiting active
- [ ] CORS properly configured
- [ ] Security headers enabled
- [ ] Error tracking working
- [ ] Load balancing configured
- [ ] Auto-scaling policies set
- [ ] Documentation updated
- [ ] Team trained on processes
- [ ] Incident response plan ready

---

**Deployment Complete!**

For questions or incidents: ops@couture-supplies.com
