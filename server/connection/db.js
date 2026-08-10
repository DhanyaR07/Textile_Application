import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQLHOST || '127.0.0.1',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQLDATABASE || 'sbk',
  port: Number(process.env.MYSQLPORT) || 3307,
  ssl: process.env.MYSQLHOST ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : null,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;