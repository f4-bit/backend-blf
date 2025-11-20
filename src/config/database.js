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

export const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then(pool => {
    console.log('✅ Connected to SQL Server:', dbConfig.server);
    return pool;
  })
  .catch(err => {
    console.error('❌ DB Connection Failed:', err);
    throw err;
  });

export default sql;
