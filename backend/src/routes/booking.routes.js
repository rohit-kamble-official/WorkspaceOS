import { Router } from 'express';
import { bookingService } from '../services/booking.service.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { sendSuccess, sendCreated, sendPaginated, buildPaginationMeta } from '../utils/response.js';
import { z } from 'zod';
import { validate } from '../middlewares/validate.js';

const router = Router();

const createBookingSchema = z.object({
  body: z.object({
    roomId: z.string().uuid(),
    deskId: z.string().uuid().optional(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    title: z.string().max(200).optional(),
    notes: z.string().max(500).optional()
  })
});

/**
 * @swagger
 * /bookings:
 *   post:
 *     tags: [Bookings]
 *     summary: Create a new booking
 *     security: [{ bearerAuth: [] }]
 */
router.post('/', authenticate, authorize('booking:create'), validate(createBookingSchema), async (req, res, next) => {
  try {
    const booking = await bookingService.createBooking({
      ...req.validated.body,
      userId: req.user.id,
      tenantId: req.user.tenantId
    });
    return sendCreated(res, booking, 'Booking created successfully');
  } catch (error) { next(error); }
});

/**
 * @swagger
 * /bookings:
 *   get:
 *     tags: [Bookings]
 *     summary: List bookings
 *     security: [{ bearerAuth: [] }]
 */
router.get('/', authenticate, authorize('booking:read'), async (req, res, next) => {
  try {
    const result = await bookingService.getBookings({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      userRoles: req.user.roles,
      query: req.query
    });
    const pagination = buildPaginationMeta(result.total, result.page, result.limit);
    return sendPaginated(res, result.bookings, pagination);
  } catch (error) { next(error); }
});

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get booking by ID
 *     security: [{ bearerAuth: [] }]
 */
router.get('/:id', authenticate, authorize('booking:read'), async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById({
      id: req.params.id,
      tenantId: req.user.tenantId,
      userId: req.user.id,
      userRoles: req.user.roles
    });
    return sendSuccess(res, booking);
  } catch (error) { next(error); }
});

/**
 * @swagger
 * /bookings/{id}/approve:
 *   patch:
 *     tags: [Bookings]
 *     summary: Approve a pending booking
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/:id/approve', authenticate, authorize('booking:approve'), async (req, res, next) => {
  try {
    const booking = await bookingService.approveBooking({
      id: req.params.id,
      tenantId: req.user.tenantId,
      userId: req.user.id
    });
    return sendSuccess(res, booking, 'Booking approved');
  } catch (error) { next(error); }
});

/**
 * @swagger
 * /bookings/{id}/cancel:
 *   patch:
 *     tags: [Bookings]
 *     summary: Cancel a booking
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/:id/cancel', authenticate, authorize('booking:cancel'), async (req, res, next) => {
  try {
    const booking = await bookingService.cancelBooking({
      id: req.params.id,
      tenantId: req.user.tenantId,
      userId: req.user.id,
      userRoles: req.user.roles,
      reason: req.body.reason
    });
    return sendSuccess(res, booking, 'Booking cancelled');
  } catch (error) { next(error); }
});

/**
 * @swagger
 * /bookings/availability/{roomId}:
 *   get:
 *     tags: [Bookings]
 *     summary: Get room availability for a date
 *     security: [{ bearerAuth: [] }]
 */
router.get('/availability/:roomId', authenticate, async (req, res, next) => {
  try {
    const data = await bookingService.getRoomAvailability({
      roomId: req.params.roomId,
      date: req.query.date || new Date().toISOString(),
      tenantId: req.user.tenantId
    });
    return sendSuccess(res, data);
  } catch (error) { next(error); }
});

export default router;
