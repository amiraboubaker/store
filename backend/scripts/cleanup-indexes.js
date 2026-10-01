const { Sequelize } = require('sequelize');
require('dotenv').config();

const s = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false
});

const tables = ['Products'];

(async () => {
    for (const table of tables) {
        const [rows] = await s.query('SHOW INDEX FROM `' + table + '`');

        // keyName -> { cols: [...], nonUnique }
        const keys = {};
        for (const r of rows) {
            if (!keys[r.Key_name]) keys[r.Key_name] = { cols: [], nonUnique: r.Non_unique };
            keys[r.Key_name].cols[r.Seq_in_index - 1] = r.Column_name;
        }

        // column-set -> list of keyNames (preserve order)
        const byCols = {};
        for (const [name, info] of Object.entries(keys)) {
            const colSet = info.cols.join(',');
            (byCols[colSet] = byCols[colSet] || []).push({ name, nonUnique: info.nonUnique });
        }

        const toDrop = [];
        for (const group of Object.values(byCols)) {
            if (group.length <= 1) continue;
            // Prefer to keep a UNIQUE index if present, else the first.
            const keepIdx = group.find((g) => g.nonUnique === 0) ? group.findIndex((g) => g.nonUnique === 0) : 0;
            group.forEach((g, i) => {
                if (i !== keepIdx) toDrop.push(g.name);
            });
        }

        console.log(`\n${table}: ${rows.length} indexes, dropping ${toDrop.length} duplicates`);
        for (const name of toDrop) {
            await s.query('DROP INDEX `' + name + '` ON `' + table + '`');
            console.log('  dropped', name);
        }
    }
    await s.close();
    console.log('\nDone.');
})().catch((e) => {
    console.error('ERROR', e.message);
    process.exit(1);
});
