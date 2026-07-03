import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: '127.0.0.1',                  // Use the explicit local IP address string
  user: 'root',                       // Default XAMPP user is root
  password: '',                       // 💡 Note: Default XAMPP MySQL has NO password (leave it empty '')
  database: 'sbk',                    // Your target database name
  port: 3307,                         // 💡 CHANGED THIS LINE from 3306 to 3307 to match XAMPP!
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;