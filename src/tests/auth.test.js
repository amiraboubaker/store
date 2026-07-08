// src/tests/auth.test.js
// Jest test suite for authentication

const request = require('supertest');
const { app, bootstrap } = require('../index');

describe('Authentication API', () => {
    let User;
    let sequelize;

    beforeAll(async () => {
        // Connect to database, register routes, and start from a clean slate
        const bootstrapped = await bootstrap();
        User = bootstrapped.User;
        sequelize = bootstrapped.sequelize;
        await User.destroy({ where: {} });
    });

    afterAll(async () => {
        // Clean up and close connection
        if (sequelize) {
            await sequelize.close();
        }
    });

    describe('POST /auth/register', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    password: 'SecurePass123!',
                    confirmPassword: 'SecurePass123!'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.data.user.email).toBe('john@example.com');
            expect(res.body.data.token).toBeDefined();
            expect(res.body.data.refreshToken).toBeDefined();
        });

        it('should reject duplicate email', async () => {
            await request(app)
                .post('/auth/register')
                .send({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'test@example.com',
                    password: 'SecurePass123!',
                    confirmPassword: 'SecurePass123!'
                });

            const res = await request(app)
                .post('/auth/register')
                .send({
                    firstName: 'Jane',
                    lastName: 'Smith',
                    email: 'test@example.com',
                    password: 'SecurePass123!',
                    confirmPassword: 'SecurePass123!'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.code).toBe('USER_ALREADY_EXISTS');
        });

        it('should reject weak password', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'weakpass@example.com',
                    password: 'weak',
                    confirmPassword: 'weak'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.code).toBe('VALIDATION_ERROR');
            expect(res.body.data.errors.password).toBeDefined();
        });

        it('should reject mismatched passwords', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'mismatch@example.com',
                    password: 'SecurePass123!',
                    confirmPassword: 'DifferentPass123!'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.code).toBe('VALIDATION_ERROR');
        });

        it('should reject invalid email', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'not-an-email',
                    password: 'SecurePass123!',
                    confirmPassword: 'SecurePass123!'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('POST /auth/login', () => {
        beforeEach(async () => {
            // Create test user
            await request(app)
                .post('/auth/register')
                .send({
                    firstName: 'Test',
                    lastName: 'User',
                    email: 'login@example.com',
                    password: 'SecurePass123!',
                    confirmPassword: 'SecurePass123!'
                });
        });

        it('should login successfully with correct credentials', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'SecurePass123!'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.token).toBeDefined();
            expect(res.body.data.refreshToken).toBeDefined();
        });

        it('should reject incorrect password', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'WrongPassword123!'
                });

            expect(res.statusCode).toBe(401);
            expect(res.body.code).toBe('INVALID_CREDENTIALS');
        });

        it('should reject non-existent user', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'SecurePass123!'
                });

            expect(res.statusCode).toBe(401);
            expect(res.body.code).toBe('INVALID_CREDENTIALS');
        });

        it('should lock account after 5 failed attempts', async () => {
            // Attempt login 5 times with wrong password
            for (let i = 0; i < 5; i++) {
                await request(app)
                    .post('/auth/login')
                    .send({
                        email: 'login@example.com',
                        password: 'WrongPassword123!'
                    });
            }

            // 6th attempt should result in locked account
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'SecurePass123!'
                });

            expect(res.statusCode).toBe(429);
            expect(res.body.code).toBe('ACCOUNT_LOCKED');
        });
    });

    describe('GET /auth/me', () => {
        let token;

        beforeAll(async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    firstName: 'Profile',
                    lastName: 'Test',
                    email: 'profile@example.com',
                    password: 'SecurePass123!',
                    confirmPassword: 'SecurePass123!'
                });

            token = res.body.data.token;
        });

        it('should return current user profile', async () => {
            const res = await request(app)
                .get('/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.user.email).toBe('profile@example.com');
            expect(res.body.data.user.password).toBeUndefined();
        });

        it('should reject request without token', async () => {
            const res = await request(app)
                .get('/auth/me');

            expect(res.statusCode).toBe(401);
            expect(res.body.code).toBe('AUTH_MISSING_TOKEN');
        });

        it('should reject request with invalid token', async () => {
            const res = await request(app)
                .get('/auth/me')
                .set('Authorization', 'Bearer invalid.token.here');

            expect(res.statusCode).toBe(401);
            expect(res.body.code).toBe('AUTH_INVALID_TOKEN');
        });
    });

    describe('POST /auth/request-password-reset', () => {
        beforeEach(async () => {
            await request(app)
                .post('/auth/register')
                .send({
                    firstName: 'Reset',
                    lastName: 'Test',
                    email: 'reset@example.com',
                    password: 'SecurePass123!',
                    confirmPassword: 'SecurePass123!'
                });
        });

        it('should return success for valid email', async () => {
            const res = await request(app)
                .post('/auth/request-password-reset')
                .send({
                    email: 'reset@example.com'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            // In development, resetToken should be included
            if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
                expect(res.body.data.resetToken).toBeDefined();
            }
        });

        it('should return success for non-existent email (security)', async () => {
            const res = await request(app)
                .post('/auth/request-password-reset')
                .send({
                    email: 'nonexistent@example.com'
                });

            expect(res.statusCode).toBe(200);
            // Should not reveal if email exists
            expect(res.body.message).toContain('If email exists');
        });
    });

    describe('POST /auth/reset-password', () => {
        let resetToken;

        beforeEach(async () => {
            // Register user
            await request(app)
                .post('/auth/register')
                .send({
                    firstName: 'Reset',
                    lastName: 'User',
                    email: 'resetpass@example.com',
                    password: 'SecurePass123!',
                    confirmPassword: 'SecurePass123!'
                });

            // Request reset and get token (development mode)
            const res = await request(app)
                .post('/auth/request-password-reset')
                .send({
                    email: 'resetpass@example.com'
                });

            if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
                resetToken = res.body.data.resetToken;
            }
        });

        it('should reset password with valid token', async () => {
            const res = await request(app)
                .post('/auth/reset-password')
                .send({
                    token: resetToken,
                    newPassword: 'NewSecurePass456!',
                    confirmPassword: 'NewSecurePass456!'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.code).toBe('PASSWORD_RESET_SUCCESS');

            // Try login with new password
            const loginRes = await request(app)
                .post('/auth/login')
                .send({
                    email: 'resetpass@example.com',
                    password: 'NewSecurePass456!'
                });

            expect(loginRes.statusCode).toBe(200);
        });

        it('should reject invalid token', async () => {
            const res = await request(app)
                .post('/auth/reset-password')
                .send({
                    token: 'a'.repeat(64),
                    newPassword: 'NewSecurePass456!',
                    confirmPassword: 'NewSecurePass456!'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.code).toBe('INVALID_RESET_TOKEN');
        });

        it('should reject reuse of same token', async () => {
            // First reset
            await request(app)
                .post('/auth/reset-password')
                .send({
                    token: resetToken,
                    newPassword: 'NewSecurePass456!',
                    confirmPassword: 'NewSecurePass456!'
                });

            // Try to reuse same token
            const res = await request(app)
                .post('/auth/reset-password')
                .send({
                    token: resetToken,
                    newPassword: 'AnotherPass789!',
                    confirmPassword: 'AnotherPass789!'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.code).toBe('INVALID_RESET_TOKEN');
        });
    });

    describe('Role-Based Access Control', () => {
        let customerToken;
        let adminToken;

        beforeAll(async () => {
            // Register customer
            const customerRes = await request(app)
                .post('/auth/register')
                .send({
                    firstName: 'Customer',
                    lastName: 'User',
                    email: 'customer@example.com',
                    password: 'SecurePass123!',
                    confirmPassword: 'SecurePass123!'
                });
            customerToken = customerRes.body.data.token;

            // Register and promote to admin
            const adminRes = await request(app)
                .post('/auth/register')
                .send({
                    firstName: 'Admin',
                    lastName: 'User',
                    email: 'admin@example.com',
                    password: 'SecurePass123!',
                    confirmPassword: 'SecurePass123!'
                });
            adminToken = adminRes.body.data.token;
            // In real scenario, admin would be created separately with admin role
        });

        it('should allow customer to access customer routes', async () => {
            const res = await request(app)
                .get('/customer/orders')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.userId).toBeDefined();
        });

        it('should deny customer access to admin routes', async () => {
            const res = await request(app)
                .get('/admin/users')
                .set('Authorization', `Bearer ${customerToken}`);

            expect(res.statusCode).toBe(403);
            expect(res.body.code).toBe('AUTH_INSUFFICIENT_PERMISSIONS');
        });
    });

    describe('Security Headers', () => {
        it('should not expose sensitive data', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'test123'
                });

            // Should not expose whether email exists or not in error
            expect(res.body.message).not.toContain('Email not found');
        });

        it('should reject oversized payloads', async () => {
            const largePayload = 'x'.repeat(11000); // Exceeds 10kb limit

            const res = await request(app)
                .post('/auth/register')
                .send({
                    firstName: largePayload,
                    lastName: 'Test',
                    email: 'test@example.com',
                    password: 'SecurePass123!',
                    confirmPassword: 'SecurePass123!'
                });

            expect(res.statusCode).toBeGreaterThanOrEqual(400);
        });
    });
});

/**
 * Running Tests
 *
 * npm test                    # Run all tests
 * npm test -- --watch       # Run in watch mode
 * npm test -- --coverage    # Generate coverage report
 * npm test -- auth.test     # Run specific test file
 */

/**
 * Test Coverage Goals
 * - Authentication: 95%+
 * - Validation: 100%
 * - Error Handling: 95%+
 * - Security: 90%+
 * - Overall: 90%+
 */
