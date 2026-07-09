require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize');
const { errorHandler, createAuthMiddleware } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected.example');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');

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
app.use(express.json({ limit: '10kb', verify: (req, res, buf) => {
    req.rawBody = buf;
}}));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

/**
 * Database Connection and Initialization
 */
let sequelize;
let User;
let Product;
let Cart;
let Order;
let OrderItem;
let Payment;

const initializeDatabase = async () => {
    try {
        const isJest = process.env.JEST_WORKER_ID !== undefined;
        const useSqlite = process.env.DB_DIALECT === 'sqlite' || process.env.NODE_ENV === 'test' || process.env.DB_HOST === 'sqlite' || (process.env.DB_NAME || '').includes('.sqlite') || !process.env.DB_HOST || isJest;

        // Create Sequelize instance
        sequelize = new Sequelize(
            process.env.DB_NAME || (useSqlite ? 'database.sqlite' : 'couture_auth'),
            process.env.DB_USER || 'root',
            process.env.DB_PASSWORD || 'password',
            {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 3306,
                dialect: useSqlite ? 'sqlite' : 'mysql',
                storage: useSqlite ? (process.env.DB_STORAGE || 'database.sqlite') : undefined,
                logging: false,
                pool: useSqlite ? undefined : {
                    max: 5,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                }
            }
        );

        // Test connection
        await sequelize.authenticate();
        console.log(useSqlite ? '✓ SQLite database connected' : '✓ MySQL database connected');

        // Define models
        User = require('./models/User')(sequelize);
        Product = require('./models/Product')(sequelize);
        Cart = require('./models/Cart')(sequelize);
        Order = require('./models/Order')(sequelize);
        OrderItem = require('./models/OrderItem')(sequelize);
        Payment = require('./models/Payment')(sequelize);

        if (User.associate) {
            User.associate({ User, Product, Cart, Order, OrderItem, Payment });
        }
        if (Product.associate) {
            Product.associate({ User, Product, Cart, Order, OrderItem, Payment });
        }
        if (Cart.associate) {
            Cart.associate({ User, Product, Cart, Order, OrderItem, Payment });
        }
        if (Order.associate) {
            Order.associate({ User, Product, Cart, Order, OrderItem, Payment });
        }
        if (OrderItem.associate) {
            OrderItem.associate({ User, Product, Cart, Order, OrderItem, Payment });
        }
        if (Payment.associate) {
            Payment.associate({ User, Product, Cart, Order, OrderItem, Payment });
        }

        // Sync database (create tables if they don't exist, and reconcile
        // existing tables with the models so missing columns/indexes are added)
        const syncOptions = isJest ? { force: true } : { alter: true };
        await sequelize.sync(syncOptions);
        console.log('✓ Database tables synced');

        return { sequelize, User, Product, Cart, Order, OrderItem, Payment };
    } catch (error) {
        console.error('✗ Database connection error:', error.message);
        throw error;
    }
};

/**
 * Routes Setup (requires User model to be defined)
 */
const setupRoutes = (User, Product, Cart, Order, OrderItem, Payment) => {
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
    app.use('/auth', authRoutes(User, Product, Cart));

    // Protected Routes Example
    app.use('/admin', protectedRoutes(User));
    app.use('/customer', protectedRoutes(User));
    app.use('/products', productRoutes(User, Product));
    app.use('/cart', cartRoutes(User, Product, Cart));
    app.use('/checkout', checkoutRoutes(User, Product, Cart, Order, OrderItem, Payment));

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
    const { sequelize: db, User, Product, Cart, Order, OrderItem, Payment } = await initializeDatabase();
    sequelize = db;

    setupRoutes(User, Product, Cart, Order, OrderItem, Payment);

    return { app, User, Product, Cart, Order, OrderItem, Payment, sequelize };
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
