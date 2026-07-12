import { Router } from 'express';
import { analyticsService } from '../services/analytics.service.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

router.get('/dashboard', authenticate, authorize('analytics:view'), async (req, res, next) => {
  try {
    const stats = await analyticsService.getDashboardStats(req.user.tenantId);
    return sendSuccess(res, stats);
  } catch (error) { next(error); }
});

router.get('/revenue', authenticate, authorize('analytics:view'), async (req, res, next) => {
  try {
    const data = await analyticsService.getRevenueChart(req.user.tenantId, parseInt(req.query.months) || 6);
    return sendSuccess(res, data);
  } catch (error) { next(error); }
});

router.get('/bookings/daily', authenticate, authorize('analytics:view'), async (req, res, next) => {
  try {
    const data = await analyticsService.getDailyBookings(req.user.tenantId, parseInt(req.query.days) || 30);
    return sendSuccess(res, data);
  } catch (error) { next(error); }
});

router.get('/bookings/status', authenticate, authorize('analytics:view'), async (req, res, next) => {
  try {
    const data = await analyticsService.getBookingsByStatus(req.user.tenantId);
    return sendSuccess(res, data);
  } catch (error) { next(error); }
});

router.get('/rooms/top', authenticate, authorize('analytics:view'), async (req, res, next) => {
  try {
    const data = await analyticsService.getTopRooms(req.user.tenantId, parseInt(req.query.limit) || 5);
    return sendSuccess(res, data);
  } catch (error) { next(error); }
});

router.get('/subscription', authenticate, authorize('billing:view'), async (req, res, next) => {
  try {
    const data = await analyticsService.getSubscriptionStatus(req.user.tenantId);
    return sendSuccess(res, data);
  } catch (error) { next(error); }
});

export default router;
