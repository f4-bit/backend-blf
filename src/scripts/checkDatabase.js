import pkg from 'mssql';
import dotenv from 'dotenv';
dotenv.config();

const sql = pkg;

const config = {
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

async function checkDatabase() {
  try {
    console.log("🔗 Conectando a Azure SQL...");
    const pool = await sql.connect(config);

    const queries = [
      "SELECT COUNT(*) AS users FROM users",
      "SELECT COUNT(*) AS donors FROM donors",
      "SELECT COUNT(*) AS campaigns FROM campaigns",
      "SELECT COUNT(*) AS appointments FROM appointments",
      "SELECT COUNT(*) AS donations FROM donations",
      "SELECT COUNT(*) AS inventory FROM inventory"
    ];

    console.log("\n📊 Verificando registros actuales...");
    for (const q of queries) {
      const res = await pool.request().query(q);
      const key = Object.keys(res.recordset[0])[0];
      const value = res.recordset[0][key];
      console.log(`✅ ${key}: ${value}`);
    }

    await pool.close();
    console.log("\n🧩 Verificación completada con éxito.");
  } catch (err) {
    console.error("❌ Error al verificar la base de datos:", err);
  }
}

checkDatabase();
