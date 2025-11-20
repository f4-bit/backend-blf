import { poolPromise } from '../config/database.js';

/**
 * GET /api/campaigns
 * Lista todas las campañas publicadas (published = 1)
 */
export const getAllCampaigns = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
                SELECT
                    id, title, description, location, latitude, longitude,
                    start_date, end_date, capacity_total, capacity_available,
                    organizer_id, published, created_at, updated_at
                FROM campaigns
                WHERE published = 1
                ORDER BY start_date ASC
            `);
        return res.status(200).json(result.recordset);
    } catch (err) {
        console.error('Error fetching campaigns:', err);
        return res.status(500).json({ message: 'Error fetching campaigns' });
    }
};

/**
 * GET /api/campaigns:id
 * Obtiene los detalles de una campaña específica por su ID
 */
export const getCampaignById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', id)
            .query(`
                SELECT
                    id, title, description, location, latitude, longitude,
                    start_date, end_date, capacity_total, capacity_available,
                    organizer_id, published, created_at, updated_at
                FROM campaigns
                WHERE id = @id
            `);

        if (result.recordset.length === 0)
            return res.status(404).json({ message: 'Campaign not found' });

        return res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error('Error fetching campaign by ID:', err);
        return res.status(500).json({ message: 'Error fetching campaign' });
    }
};