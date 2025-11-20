import { poolPromise } from '../config/database.js';
import sql from 'mssql';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/donations
 * Creates a new donation (only if the donor is eligible)
 * and updates inventory transactionally.
 * Requires 'medical_staff' role.
 */
export const createDonation = async (req, res) => {
  const { appointment_id, volume_ml, blood_type, bag_id: providedBagId, observations } = req.body;

  if (!appointment_id || !volume_ml || !blood_type) {
    return res.status(400).json({
      message: 'Missing required fields: appointment_id, volume_ml, blood_type'
    });
  }

  const user = req.user;
  if (!user || user.role !== 'medical_staff') {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // 1️⃣ Verificar cita y elegibilidad
    const apptReq = new sql.Request(transaction);
    const apptRes = await apptReq
      .input('appointment_id', sql.UniqueIdentifier, appointment_id)
      .query(`
        SELECT id, donor_id, campaign_id, status, eligibility_checked
        FROM appointments
        WHERE id = @appointment_id
      `);

    if (apptRes.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const appointment = apptRes.recordset[0];

    if (appointment.status === 'completed') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Donation already recorded for this appointment' });
    }

    if (!appointment.eligibility_checked) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Donor eligibility has not been verified yet' });
    }

    // 2️⃣ Insert donation
    const donationId = uuidv4();
    const bagId = providedBagId || `BAG_${Math.floor(Math.random() * 90000) + 1000}`;

    const insertReq = new sql.Request(transaction);
    await insertReq
      .input('id', sql.UniqueIdentifier, donationId)
      .input('appointment_id', sql.UniqueIdentifier, appointment_id)
      .input('donor_id', sql.UniqueIdentifier, appointment.donor_id)
      .input('campaign_id', sql.UniqueIdentifier, appointment.campaign_id)
      .input('bag_id', sql.NVarChar(100), bagId)
      .input('volume_ml', sql.Int, volume_ml)
      .input('blood_type', sql.NVarChar(10), blood_type)
      .input('collector_id', sql.UniqueIdentifier, user.id)
      .input('observations', sql.NVarChar(sql.MAX), observations || null)
      .query(`
        INSERT INTO donations
        (id, appointment_id, donor_id, campaign_id, bag_id, volume_ml, blood_type, collector_id, observations)
        VALUES (@id, @appointment_id, @donor_id, @campaign_id, @bag_id, @volume_ml, @blood_type, @collector_id, @observations)
      `);

    // 3️⃣ Update appointment to completed
    const updateApptReq = new sql.Request(transaction);
    await updateApptReq
      .input('appointment_id', sql.UniqueIdentifier, appointment_id)
      .query(`
        UPDATE appointments
        SET status = 'completed'
        WHERE id = @appointment_id
      `);

    // 4️⃣ Update or create inventory
    const invReq = new sql.Request(transaction);
    const invRes = await invReq
      .input('blood_type', sql.NVarChar(10), blood_type)
      .query('SELECT id, units_available FROM inventory WHERE blood_type = @blood_type');

    if (invRes.recordset.length > 0) {
      const inventory = invRes.recordset[0];
      const updateInvReq = new sql.Request(transaction);
      await updateInvReq
        .input('inventory_id', sql.UniqueIdentifier, inventory.id)
        .input('new_units', sql.Int, inventory.units_available + 1)
        .query(`
          UPDATE inventory
          SET units_available = @new_units
          WHERE id = @inventory_id
        `);
    } else {
      const newInventoryId = uuidv4();
      const insertInvReq = new sql.Request(transaction);
      await insertInvReq
        .input('new_id', sql.UniqueIdentifier, newInventoryId)
        .input('blood_type', sql.NVarChar(10), blood_type)
        .input('units_available', sql.Int, 1)
        .query(`
          INSERT INTO inventory (id, blood_type, units_available)
          VALUES (@new_id, @blood_type, @units_available)
        `);
    }

    // 5️⃣ Commit transaction
    await transaction.commit();

    return res.status(201).json({
      message: 'Donation recorded successfully',
      donation_id: donationId,
      appointment_id,
      donor_id: appointment.donor_id,
      campaign_id: appointment.campaign_id,
      bag_id: bagId,
      blood_type,
      volume_ml
    });
  } catch (err) {
    console.error('❌ Error creating donation:', err);

    try {
      await transaction.rollback();
    } catch (rollbackErr) {
      console.error('⚠️ Error rolling back transaction:', rollbackErr);
    }

    return res.status(500).json({ message: 'Server error' });
  }
};
