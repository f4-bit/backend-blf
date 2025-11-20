import express from 'express';
import { getInventory } from '../controllers/inventory.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Access: medical_staff or admin
router.get('/', requireAuth(['medical_staff', 'admin']), getInventory);

export default router;