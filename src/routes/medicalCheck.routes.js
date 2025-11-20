import express from 'express';
import { createMedicalCheck } from '../controllers/medicalCheck.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js'; 

const router = express.Router();

/**
 * @route POST /api/medical_checks
 * @desc Registra una evaluación médica previa a la donación
 * @access Privado (solo rol 'medical_staff')
 */
router.post('/', requireAuth(['medical_staff']), createMedicalCheck);

export default router;