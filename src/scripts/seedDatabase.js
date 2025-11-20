import fs from 'fs';
import pkg from 'mssql';
import dotenv from 'dotenv';
dotenv.config();

const sql = pkg;

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '1433'),
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', // Required for Azure
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true'
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

async function seedDatabase() {
    try {
        console.log('Cargando archivo db_seed.sql...');
        const sqlScript = fs.readFileSync("./src/scripts/db_seed.sql", "utf-8");

        console.log('Conectando a Azure SQL...');
        const pool = await sql.connect(dbConfig);

        console.log('Ejecutando inserciones...');
        await pool.request().batch(sqlScript);

        // Verification before closing the connection
        const result = await pool.request().query("SELECT COUNT(*) AS total_users FROM users");
        console.log(`👤 Usuarios insertados: ${result.recordset[0].total_users}`);

        console.log('🔄 Rehasheando contraseñas de usuarios...');
        await import('./rehashPasswords.js');

        console.log('Datos sinteticos insertados correctamente en Azure SQL.');
        await pool.close();
    } catch (err) {
        console.error('Error al insertar datos sinteticos en Azure SQL:', err);
    }
}

seedDatabase();

