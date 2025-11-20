import { poolPromise } from '../config/database.js';
import sql from 'mssql';

/**
 * GET /api/inventory
 * Security: requireAuth(['medical_staff', 'admin'])
 * Response 200 (según contrato):
 * {
 *  "data": [
 *    { "blood_type": "O+", "units_available": 12 },
 *    { "blood_type": "A+", "units_available": 9 }
 *  ],
 *  "last_updated": "2025-11-15T10:00:00Z"
 * }
 */ 
export const getInventory = async (req, res) => {
  try {
    const pool = await poolPromise;

    // Check inventory
    const invRes = await pool.request()
      .query(`
        SELECT blood_type, units_available
        FROM inventory
        ORDER BY blood_type ASC
      `);

    const data = invRes.recordset.map(r => ({
      blood_type: r.blood_type,
      units_available: Number(r.units_available) || 0
    }));

    // Use current date as last_updated
    const last_updated = new Date().toISOString();

    return res.status(200).json({ data, last_updated });
  } catch (err) {
    console.error('Error getting inventory:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
