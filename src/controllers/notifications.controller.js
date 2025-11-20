import { poolPromise } from '../config/database.js';
import sql from 'mssql';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/notifications/send
 * Enqueues a notification for a user.
 * Requires 'admin' or 'system' role.
 * Contract returns 202 Accepted.
 */
export const sendNotification = async (req, res) => {
    const { user_id, type, subject, body } = req.body;

    // Validate required fields
    if (!user_id || !type || !subject || !body) {
        return res.status(400).json({ message: 'Missing required fields: user_id, type, subject, body' });
    }

    const user = req.user;
    if (!user || !['admin', 'system'].includes(user.role)) {
        return res.status(403).json({ message: 'Insuficcient permissions' });
    }

    const pool = await poolPromise;

    try {
        // Validate user exists
        const userReq = new sql.Request(pool);
        const userRes = await userReq 
            .input('user_id', sql.UniqueIdentifier, user_id)
            .query(`
                SELECT id FROM users WHERE id = @user_id
            `);

        if (userRes.recordset.length === 0) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Insert notification into queue (status = queued)
        const notifId = uuidv4();

        const insertReq = new sql.Request(pool);
        const insertRes = await insertReq
            .input('id', sql.UniqueIdentifier, notifId)
            .input('user_id', sql.UniqueIdentifier, user_id)
            .input('type', sql.NVarChar(20), type)
            .input('payload', sql.NVarChar(sql.MAX), JSON.stringify({ subject, body }))
            .query(`
                INSERT INTO notifications (id, user_id, type, payload)
                VALUES (@id, @user_id, @type, @payload)
            `);

        // Nothing else is done; scheduler is out of scope (Contract)

        return res.status(202).json({
            data: {
                id: notifId,
                status: 'queued'
            },
            message: 'Notification scheduled for delivery'
        });
    } catch (err) {
        console.error('Error sending notification:', err)
        return res.status(500).json({ message: 'Server error' });
    }
};