import { Router } from 'express';
import authRoutes from './auth.routes.js';
import tenantRoutes from './tenant.routes.js';
import userRoutes from './user.routes.js';
import buildingRoutes from './building.routes.js';
import bookingRoutes from './booking.routes.js';
import analyticsRoutes from './analytics.routes.js';
import notificationRoutes from './notification.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/users', userRoutes);
router.use('/buildings', buildingRoutes);
router.use('/bookings', bookingRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);

export default router;
