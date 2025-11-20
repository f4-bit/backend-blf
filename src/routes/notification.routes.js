import express from 'express';
import { sendNotification } from '../controllers/notifications.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @route POST /api/notifications/send
 * @desc Queue a notification according to the contract
 * @access Private (roles: admin, system)
 */
router.post(
    '/send',
    requireAuth(['admin', 'system']),
    sendNotification
);

export default router;