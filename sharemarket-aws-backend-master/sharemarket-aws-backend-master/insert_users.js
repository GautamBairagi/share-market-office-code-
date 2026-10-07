require('dotenv').config();
const mysql = require('mysql2/promise');

async function insertUsers() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'trading_db',
        port: 3306,
    });

    try {
        console.log('Fetching superadmin...');
        const [adminRows] = await connection.execute("SELECT id FROM users WHERE role='SUPERADMIN' LIMIT 1");
        const parentId = adminRows.length > 0 ? adminRows[0].id : 1;

        console.log(`Using parent_id = ${parentId}`);

        console.log('Inserting 5000 users...');
        const values = [];
        const timestamp = Date.now();
        for (let i = 1; i <= 5000; i++) {
            values.push([
                `trader_client_${timestamp}_${i}`, // username
                '$2b$10$dUJw1OyxJjMAmoOuUn5kWuMF/Y1tJT1KTQu1q.INWA./OhXssK68C', // password
                '$2b$10$3.bym55ID4C8yusIe1Z4tuyYqVb8TAs5BwnAZ.q0rKiYROahHozG2', // transaction_password
                `Trading Client ${i}`, // full_name
                'TRADER', // role
                'Active', // status
                parentId, // parent_id
                500000.00, // balance
                0, // is_demo
                new Date() // created_at
            ]);
        }

        const batchSize = 1000;
        for (let i = 0; i < values.length; i += batchSize) {
            const batch = values.slice(i, i + batchSize);
            await connection.query(
                `INSERT INTO users (username, password, transaction_password, full_name, role, status, parent_id, balance, is_demo, created_at) VALUES ?`,
                [batch]
            );
            console.log(`Inserted batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(values.length / batchSize)}`);
        }

        console.log('Done inserting 5000 users.');
    } catch (e) {
        console.error(e);
    } finally {
        await connection.end();
    }
}

insertUsers();
