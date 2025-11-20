import { poolPromise } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import sql from 'mssql'; 

/**
 * POST /api/appointments
 * Crea una cita de donación
 * Body esperado:
 * {
 *   "donor_id": "...",
 *   "campaign_id": "...",
 *   "slot_datetime": "2025-11-10T09:30:00"
 * }
 */

export const createAppointment = async (req, res) => {
  const { campaign_id, slot_datetime } = req.body; // Ya no pedir donor_id
  if (!campaign_id || !slot_datetime)
    return res.status(400).json({ message: 'Missing required fields' });
    
  try {
    const user = req.user; // Del JWT
    if (!user || !user.id) 
      return res.status(401).json({ message: 'Unauthorized' });
    
    const pool = await poolPromise;
    
    // Obtener donor_id del user_id (igual que en getMyAppointments)
    const donorRes = await pool.request()
      .input('user_id', sql.UniqueIdentifier, user.id)
      .query('SELECT id FROM donors WHERE user_id = @user_id');
      
    if (donorRes.recordset.length === 0) {
      return res.status(404).json({ message: 'Donor profile not found for this user' });
    }
    
    const donor_id = donorRes.recordset[0].id;
    
    const newId = uuidv4();
    await pool.request()
      .input('id', sql.UniqueIdentifier, newId)
      .input('donor_id', sql.UniqueIdentifier, donor_id)
      .input('campaign_id', sql.UniqueIdentifier, campaign_id)
      .input('slot_datetime', sql.DateTime2, slot_datetime)
      .query(`
        INSERT INTO appointments (id, donor_id, campaign_id, slot_datetime, status)
        VALUES (@id, @donor_id, @campaign_id, @slot_datetime, 'scheduled')
      `);
      
    return res.status(201).json({
      message: 'Appointment created successfully',
      appointment_id: newId
    });
  } catch (err) {
    console.error('Error creating appointment:', err);
    return res.status(500).json({ message: 'Error creating appointment' });
  }
};

/**
 * GET /api/appointments/me
 * Requiere JWT (donor). Devuelve las citas del usuario autenticado.
 */

export const getMyAppointments = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.id) return res.status(401).json({ message: 'Unauthorized' });

    const pool = await poolPromise;

    // Obtain donor_id from users table (if exists)
    const donorRes = await pool.request()
      .input('user_id', sql.UniqueIdentifier, user.id)
      .query('SELECT id FROM donors WHERE user_id = @user_id');

    if (donorRes.recordset.length === 0) {
      return res.status(404).json({ message: 'Donor profile not found for this user' });
    }

    const donor_id = donorRes.recordset[0].id;

    // Obtain donor's appointments with campaign details
    const appts = await pool.request()
      .input('donor_id', sql.UniqueIdentifier, donor_id)
      .query(`
          SELECT a.id, a.slot_datetime, a.status, a.eligibility_checked, a.reminder_scheduled_at,
               c.id AS campaign_id, c.title AS campaign_title, c.location AS campaign_location     
          FROM appointments a
          LEFT JOIN campaigns c ON c.id = a.campaign_id
          WHERE a.donor_id = @donor_id
          ORDER BY a.slot_datetime DESC  
      `);

    return res.status(200).json({ data: appts.recordset });
  } catch (err) { 
    console.error('getMyAppointments error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
GET /api/appointments/pending-donations
Devuelve TODAS las citas que están aptas para registrar donación
Requiere role: medical_staff
*/
export const getPendingDonations = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'medical_staff') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    const pool = await poolPromise;
    const appts = await pool.request()
      .query(`
        SELECT 
          a.id,
          a.slot_datetime as datetime,
          a.status,
          u.full_name as donor,
          d.blood_type,
          c.title as campaign
        FROM appointments a
        INNER JOIN donors d ON a.donor_id = d.id
        INNER JOIN users u ON d.user_id = u.id
        INNER JOIN campaigns c ON a.campaign_id = c.id
        INNER JOIN medical_checks mc ON mc.appointment_id = a.id
        WHERE a.eligibility_checked = 1
          AND mc.apto = 1
          AND a.status = 'scheduled'
        ORDER BY a.slot_datetime ASC
      `);
    return res.status(200).json(appts.recordset);
  } catch (err) {
    console.error('getPendingDonations error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
GET /api/appointments/pending-checks
Devuelve TODAS las citas pendientes de evaluación médica
Requiere role: medical_staff
*/
export const getPendingChecks = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'medical_staff') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    const pool = await poolPromise;
    const appts = await pool.request()
      .query(`
        SELECT 
          a.id,
          a.slot_datetime as datetime,
          a.status,
          u.full_name as donor,
          c.title as campaign
        FROM appointments a
        INNER JOIN donors d ON a.donor_id = d.id
        INNER JOIN users u ON d.user_id = u.id
        INNER JOIN campaigns c ON a.campaign_id = c.id
        WHERE a.eligibility_checked = 0
          AND a.status = 'scheduled'
        ORDER BY a.slot_datetime ASC
      `);
    return res.status(200).json(appts.recordset);
  } catch (err) {
    console.error('getPendingChecks error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};