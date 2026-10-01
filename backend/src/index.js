require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Sequelize } = require('sequelize');
const { errorHandler } = require('./middleware/error');
const productRoutes = require('./routes/products');
const contactRoutes = require('./routes/contact');

const app = express();

/**
 * Middleware Setup
 */

// CORS Configuration
// CORS_ORIGIN is a comma separated allowlist (e.g. "https://a.com,https://b.com").
// When the request origin is allowed we echo it back instead of sending "*",
// because browsers reject "Access-Control-Allow-Origin: *" on credentialed
// requests and on any preflight whose origin must match the caller's site.
const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowAllOrigins = allowedOrigins.length === 0 || allowedOrigins.includes('*');

const corsOptions = {
    origin: (origin, callback) => {
        // Same-origin / non-CORS requests (curl, server-to-server) have no Origin.
        if (!origin) return callback(null, true);
        if (allowAllOrigins || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS blocked: origin ${origin} is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Total-Count'],
    maxAge: 86400,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Preflight requests for every API route must terminate here, before the
// route handlers, the SPA fallback and the 404 handler.
app.options('*', cors(corsOptions));

// Body Parser
app.use(express.json({ limit: '10kb', verify: (req, res, buf) => {
    req.rawBody = buf;
}}));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

/**
 * Database Connection and Initialization
 */
let sequelize;
let Product;
let Contact;

const initializeDatabase = async () => {
    try {
        const isJest = process.env.JEST_WORKER_ID !== undefined;
        const useSqlite = process.env.DB_DIALECT === 'sqlite' || process.env.NODE_ENV === 'test' || process.env.DB_HOST === 'sqlite' || (process.env.DB_NAME || '').includes('.sqlite') || !process.env.DB_HOST || isJest;

        // Jest runs test files in parallel worker processes, each of which
        // syncs with force:true below. Sharing one SQLite file makes them drop
        // and recreate each other's tables, so give every worker its own.
        const storage = useSqlite
            ? (isJest && !process.env.DB_STORAGE
                ? path.join(__dirname, '..', `test-${process.env.JEST_WORKER_ID}.sqlite`)
                : (process.env.DB_STORAGE || path.join(__dirname, '..', 'database.sqlite')))
            : undefined;

        // Create Sequelize instance
        sequelize = new Sequelize(
            process.env.DB_NAME || (useSqlite ? 'store' : 'couture_auth'),
            process.env.DB_USER || 'root',
            process.env.DB_PASSWORD || 'password',
            {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 3306,
                dialect: useSqlite ? 'sqlite' : 'mysql',
                storage,
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
        Product = require('./models/Product')(sequelize);
        Contact = require('./models/Contact')(sequelize);

        // Sync database. `alter` reconciles existing tables with the models so
        // missing columns and indexes are added. Tables whose models were
        // removed are dropped explicitly by the reset script, since Sequelize
        // never removes a table on its own.
        const syncOptions = isJest ? { force: true } : { alter: true };
        await sequelize.sync(syncOptions);
        console.log('✓ Database tables synced');

        return { sequelize, Product, Contact };
    } catch (error) {
        console.error('✗ Database connection error:', error.message);
        throw error;
    }
};

/**
 * Routes Setup (requires the Product and Contact models)
 */
const setupRoutes = (Product, Contact) => {
    // Root
    app.get('/', (req, res) => {
        res.status(200).json({
            status: 'success',
            message: 'Couture Supplies API is running',
            version: '1.0.0',
            health: '/health',
            api: '/api'
        });
    });

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
            message: 'Couture Supplies E-Commerce API',
            version: '1.0.0',
            endpoints: {
                products: '/products',
                contact: '/contact'
            }
        });
    });

    const path = require('path');

    // Frontend SPA (built with Vite, served from the same origin)
    const frontendDir = path.join(__dirname, '..', 'public', 'frontend');
    app.use(express.static(frontendDir));

    app.use('/products', productRoutes(Product));
    app.use('/contact', contactRoutes(Contact));

    // SPA fallback: any non-API GET request that wasn't matched by a route
    // or static file should return the frontend index.html
    app.get('*', (req, res, next) => {
      const apiPrefixes = ['/api', '/products', '/contact', '/health'];
      const isApi = apiPrefixes.some(prefix => req.path.startsWith(prefix));
      if (!isApi) {
        const indexPath = path.join(frontendDir, 'index.html');
        res.sendFile(indexPath, (err) => { if (err) next(); });
      } else {
        next();
      }
    });

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
    const { sequelize: db, Product, Contact } = await initializeDatabase();
    sequelize = db;

    setupRoutes(Product, Contact);

    return { app, Product, Contact, sequelize };
};

/**
 * Server Startup
 */
const startServer = async () => {
    await bootstrap();

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════╗
║  Couture Supplies API             ║
║  Server running on port ${PORT}             ║
║  Environment: ${process.env.NODE_ENV || 'development'}        ║
╚════════════════════════════════════╝
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