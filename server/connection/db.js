import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.MYSQLHOST || 'YOUR_RAILWAY_HOST',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || 'YOUR_RAILWAY_PASSWORD',
    database: process.env.MYSQLDATABASE || 'railway',
    port: process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default pool;