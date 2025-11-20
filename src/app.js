import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { poolPromise } from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import campaignRoutes from './routes/campaign.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import medicalCheckRoutes from './routes/medicalCheck.routes.js';
import donationRoutes from './routes/donation.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import notificationRoutes from './routes/notification.routes.js';

dotenv.config();
const app = express();

// Cors configuration
app.use(cors({
  origin: "http://localhost:3000",           // Local Frontend
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true
}));

app.options("*", cors());

// Global middlewares
app.use(express.json()); // Allows to read JSON in requests

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical_checks', medicalCheckRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check (to test server)
app.get('/api/health', async (req, res) => {
  try {
    await poolPromise; // BD connection test
    res.status(200).json({status: 'OK', db: 'connected'});
  } catch (error) {
    res.status(500).json({status: 'ERROR', db: 'disconnected'});
  }
});

export default app;