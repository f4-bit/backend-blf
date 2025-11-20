import express from 'express';
import { createDonation } from '../controllers/donation.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @route POST /api/donations
 * @desc Registra una donación (solo si el donante fue aprobado)
 * @access Privado (rol: medical_staff)
 */
router.post('/', requireAuth(['medical_staff']), createDonation);

export default router;
