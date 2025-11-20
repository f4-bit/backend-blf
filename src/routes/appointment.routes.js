import express from 'express';
import { createAppointment, getMyAppointments, getPendingDonations, getPendingChecks } from '../controllers/appointment.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/pending-checks', requireAuth(['medical_staff']), getPendingChecks);
router.get('/pending-donations', requireAuth(['medical_staff']), getPendingDonations);
router.post('/', requireAuth(['donor']), createAppointment);
router.get('/me', requireAuth(['donor']), getMyAppointments);


export default router;