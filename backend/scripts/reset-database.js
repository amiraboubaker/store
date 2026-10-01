/**
 * Drop every table that is not products or contacts, then let Sequelize recreate
 * those two from the models.
 *
 * Sequelize's sync({ alter: true }) only reconciles tables whose models still
 * exist; it never removes a table whose model was deleted. That is how the old
 * users/cart/orders/payments tables survived the removal of their models. This
 * script does that part explicitly.
 *
 * Run against MySQL (development):
 *   node scripts/reset-database.js
 *
 * For SQLite, pass DB_DIALECT=sqlite and DB_HOST=sqlite, or set DB_STORAGE.
 * All existing rows in every table are lost.
 */
const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Matched case-insensitively: MySQL table names are case sensitive on Linux
// containers but not on Windows or macOS, so a hardcoded 'Users' entry would
// miss a leftover `users`.
const KEEP = ['products', 'contacts'];

const useSqlite = process.env.DB_DIALECT === 'sqlite' || process.env.DB_HOST === 'sqlite';

const sequelize = useSqlite
    ? new Sequelize({
        dialect: 'sqlite',
        storage: process.env.DB_STORAGE || path.join(__dirname, '..', 'database.sqlite'),
        logging: false
    })
    : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        dialect: 'mysql',
        logging: false
    });

(async () => {
    await sequelize.authenticate();

    // Drop every table, including the two we are about to recreate. The previous
// products/contacts may have come from sql/create_tables.sql with a different
// shape than the models, so leaving them in place would preserve the old schema
// that caused the duplication in the first place.
    //
    // Order cannot be hardcoded safely: a foreign key may reference any other
    // table, so keep sweeping until a full pass drops nothing. Each sweep
    // removes whatever became droppable after the previous one.
    const existing = await sequelize.getQueryInterface().showAllTables();
    const present = new Set(existing);

    const RETIRE_SWEEPS = 10;
    for (let sweep = 0; sweep < RETIRE_SWEEPS; sweep++) {
        let droppedThisPass = 0;

        for (const table of present) {
            try {
                await sequelize.getQueryInterface().dropTable(table);
                present.delete(table);
                droppedThisPass++;
                console.log(`  dropped ${table}`);
            } catch (error) {
                // Still referenced. Retry on the next sweep, after whatever was
                // still droppable in this pass is gone.
            }
        }

        if (droppedThisPass === 0) break;
    }

    if (present.size) {
        throw new Error(
            `could not drop tables still referenced by foreign keys: ${[...present].join(', ')}. ` +
            'Drop them manually with foreign key checks disabled.'
        );
    }

    // Recreate the two survivors from the models, so the schema is exactly what
    // the models describe rather than whatever was there before.
    const Product = require('../src/models/Product')(sequelize);
    const Contact = require('../src/models/Contact')(sequelize);

    await sequelize.sync({ force: true });

    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('\nTables now present:', tables.length ? tables.join(', ') : '(none)');

    const unexpected = tables.filter((table) => !KEEP.includes(String(table).toLowerCase()));
    if (unexpected.length) {
        console.warn('\nWARNING unexpected tables still present:', unexpected.join(', '));
        process.exitCode = 1;
    } else {
        console.log('✓ Only Products and Contacts remain');
    }

    await sequelize.close();
})().catch((error) => {
    console.error('ERROR', error.message);
    process.exit(1);
});