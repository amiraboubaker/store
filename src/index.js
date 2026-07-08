require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize');
const { errorHandler, createAuthMiddleware } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected.example');
const productRoutes = require('./routes/products');

const app = express();

/**
 * Middleware Setup
 */

// CORS Configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body Parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

/**
 * Database Connection and Initialization
 */
let sequelize;
let User;
let Product;

const initializeDatabase = async () => {
    try {
        // Create Sequelize instance
        sequelize = new Sequelize(
            process.env.DB_NAME || 'couture_auth',
            process.env.DB_USER || 'root',
            process.env.DB_PASSWORD || 'password',
            {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 3306,
                dialect: 'mysql',
                logging: false,
                pool: {
                    max: 5,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                }
            }
        );

        // Test connection
        await sequelize.authenticate();
        console.log('✓ MySQL database connected');

        // Define models
        User = require('./models/User')(sequelize);
        Product = require('./models/Product')(sequelize);

        // Sync database (create tables if they don't exist, and reconcile
        // existing tables with the models so missing columns/indexes are added)
        await sequelize.sync({ alter: true });
        console.log('✓ Database tables synced');

        return { sequelize, User };
    } catch (error) {
        console.error('✗ Database connection error:', error.message);
        process.exit(1);
    }
};

/**
 * Routes Setup (requires User model to be defined)
 */
const setupRoutes = (User, Product) => {
    // Health Check
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'success',
            message: 'Server is running',
            timestamp: new Date().toISOString()
        });
    });

    // API Documentation
    app.get('/api', (req, res) => {
        res.json({
            message: 'Couture Supplies E-Commerce API - Authentication System',
            version: '1.0.0',
            endpoints: {
                authentication: '/auth',
                admin: '/admin',
                customer: '/customer'
            },
            documentation: 'See API_ROUTES.md for detailed documentation'
        });
    });

    // Create auth middleware with User model
    const { authMiddleware } = createAuthMiddleware(User);

    // Authentication Routes
    app.use('/auth', authRoutes(User));

    // Protected Routes Example
    app.use('/admin', protectedRoutes(User));
    app.use('/customer', protectedRoutes(User));
    app.use('/products', productRoutes(User, Product));

    /**
     * 404 Handler
     */
    app.use((req, res) => {
        res.status(404).json({
            status: 'error',
            code: 'ENDPOINT_NOT_FOUND',
            message: `Endpoint ${req.method} ${req.path} not found`,
            data: null
        });
    });

    /**
     * Error Handler (must be last)
     */
    app.use(errorHandler);
};

/**
 * Bootstrap the application (database + routes) without starting the server.
 * Exported so tests can initialize the app before sending requests.
 */
const bootstrap = async () => {
    const { sequelize: db, User: UserModel } = await initializeDatabase();
    sequelize = db;
    User = UserModel;

    setupRoutes(User, Product);

    return { app, User, sequelize };
};

/**
 * Server Startup
 */
const startServer = async () => {
    await bootstrap();

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════════╗
║  Couture Supplies Auth API                  ║
║  Server running on port ${PORT}             ║
║  Environment: ${process.env.NODE_ENV || 'development'}        ║
╚════════════════════════════════════════════╝
  `);
    });

    /**
     * Graceful Shutdown
     */
    process.on('SIGTERM', () => {
        console.log('SIGTERM signal received: closing HTTP server');
        server.close(() => {
            console.log('HTTP server closed');
            sequelize.close().then(() => {
                console.log('MySQL connection closed');
                process.exit(0);
            });
        });
    });

    return server;
};

// Start the server
if (require.main === module) {
    startServer().catch((error) => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
}

module.exports = { app, bootstrap };
