// src/controllers/medicalCheck.controller.js
import { poolPromise } from '../config/database.js';
import sql from 'mssql';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/medical_checks
 * Body esperado (ejemplo):
 * {
 *   "appointment_id": "GUID-de-la-cita",
 *   "answers": { "has_cold": false, "recent_tattoos": false },
 *   "vitals": { "blood_pressure": "120/80", "heart_rate": 72, "temperature": 36.8 },
 *   "apto": true,
 *   "reason_not_apto": null
 * }
 *
 * Requiere token con role = "medical_staff"
 */
export const createMedicalCheck = async (req, res) => {
  try {
    const { appointment_id, answers, vitals, apto, reason_not_apto } = req.body;

    if (!appointment_id) return res.status(400).json({ message: 'Missing appointment_id' });

    const user = req.user;
    if (!user || user.role !== 'medical_staff') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const pool = await poolPromise;

    // 1) Verificar que la cita exista y obtener donor_id
    const apptRes = await pool.request()
      .input('appointment_id', sql.UniqueIdentifier, appointment_id)
      .query('SELECT id, donor_id, status FROM appointments WHERE id = @appointment_id');

    if (apptRes.recordset.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const appointment = apptRes.recordset[0];
    const donorId = appointment.donor_id;

    // 2) Insertar en medical_checks usando checked_by = req.user.id (users.id)
    const checkId = uuidv4();
    await pool.request()
      .input('id', sql.UniqueIdentifier, checkId)
      .input('appointment_id', sql.UniqueIdentifier, appointment_id)
      .input('donor_id', sql.UniqueIdentifier, donorId)
      .input('answers', sql.NVarChar(sql.MAX), JSON.stringify(answers || {}))
      .input('vitals', sql.NVarChar(sql.MAX), JSON.stringify(vitals || {}))
      .input('apto', sql.Bit, !!apto)
      .input('reason_not_apto', sql.NVarChar(sql.MAX), reason_not_apto || null)
      .input('checked_by', sql.UniqueIdentifier, user.id)
      .query(`
        INSERT INTO medical_checks
        (id, appointment_id, donor_id, answers, vitals, apto, reason_not_apto, checked_by)
        VALUES (@id, @appointment_id, @donor_id, @answers, @vitals, @apto, @reason_not_apto, @checked_by)
      `);

    // 3) Marcar la cita como revisada (eligibility_checked = 1)
    await pool.request()
      .input('appointment_id', sql.UniqueIdentifier, appointment_id)
      .query(`
        UPDATE appointments
        SET eligibility_checked = 1
        WHERE id = @appointment_id
      `);

    return res.status(201).json({
      message: 'Medical check created successfully',
      medical_check_id: checkId
    });
  } catch (err) {
    console.error('Error creating medical check:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
