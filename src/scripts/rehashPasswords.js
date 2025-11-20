import pkg from 'mssql';
import bcrypt from 'bcrypt';
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

async function rehashPasswords() {
    try {
        console.log('Conectando a Azure SQL...');
        const pool = await sql.connect(dbConfig);

        console.log('Obteniendo constraseñas no hasheadas...');
        const result = await pool.request().query(`
            SELECT id, email, password_hash
            FROM users
            WHERE LEN(password_hash) < 60
        `);

        if (result.recordset.length === 0) {
            console.log('Todas las contraseñas ya están en formato bcrypt.');
            await pool.close();
            return;
        }

        console.log(`🔧 Encontrados ${result.recordset.length} usuarios con contraseñas sin hashear.`);

        for (const user of result.recordset) {
            const oldPassword = user.password_hash.trim();

            // Generate bcrypt hash
            const newHash = await bcrypt.hash(oldPassword, 10);

            // Update the password in the database
            await pool.request()
                .input('id', sql.UniqueIdentifier, user.id)
                .input('hash', sql.NVarChar, newHash)
                .query(`
                    UPDATE users
                    SET password_hash = @hash
                    WHERE id = @id
                `);
            console.log(`Usuario ${user.email} actualizado con nuevo hash.`);
        }

        console.log('Todas las contraseñas fueron rehaseadas correctamente.');
        await pool.close();
    } catch (err) {
        console.error('Error durante el rehash de contraseñas:', err);
    }
}

rehashPasswords();