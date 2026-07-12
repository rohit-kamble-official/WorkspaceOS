import prisma from '../database/prisma.js';
import { sendBookingConfirmation } from './email.service.js';
import { ActivityLog } from '../database/mongodb.js';
import logger from '../utils/logger.js';

export class BookingService {
  async createBooking({ userId, tenantId, roomId, deskId, startTime, endTime, title, notes }) {
   const start = new Date(startTime);
const end = new Date(endTime);

if (start < new Date()) {
  throw Object.assign(
    new Error("Cannot book in the past"),
    { statusCode: 400 }
  );
}

    // Check room exists and belongs to tenant
    const room = await prisma.room.findFirst({
      where: { 
        id: roomId, 
        floor: { building: { tenantId } },
        isActive: true
      },
      include: { floor: { include: { building: true } } }
    });

    if (!room) {
      throw Object.assign(new Error('Room not found or unavailable'), { statusCode: 404 });
    }

    // Check for conflicts
    const conflict = await prisma.booking.findFirst({
      where: {
        roomId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          { startTime: { lt: end }, endTime: { gt: start } }
        ],
        ...(deskId && { deskId })
      }
    });

    if (conflict) {
      throw Object.assign(new Error('This space is already booked for the selected time'), { statusCode: 409 });
    }

    // Calculate price
    const hours = (end - start) / (1000 * 60 * 60);
    const totalPrice = parseFloat(room.pricePerHour) * hours;

    const booking = await prisma.booking.create({
      data: {
        tenantId,
        userId,
        roomId,
        deskId,
        startTime: start,
        endTime: end,
        title,
        notes,
        totalPrice,
        status: 'PENDING'
      },
      include: {
        room: { include: { floor: { include: { building: true } } } },
        user: { select: { firstName: true, lastName: true, email: true } },
        desk: true
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        tenantId,
        userId,
        type: 'BOOKING_CREATED',
        title: 'Booking Created',
        message: `Your booking for ${room.name} has been created and is pending approval.`
      }
    });

    // Log activity
    ActivityLog.create({
      tenantId,
      userId,
      action: 'BOOKING_CREATED',
      resource: 'booking',
      resourceId: booking.id,
      details: { roomName: room.name, startTime, endTime }
    }).catch(e => logger.error('Activity log failed:', e));

    // Send confirmation email
    sendBookingConfirmation(
      booking.user.email,
      booking,
      `${booking.user.firstName} ${booking.user.lastName}`,
      room.name
    ).catch(e => logger.error('Booking email failed:', e));

    return booking;
  }

  async getBookings({ tenantId, userId, userRoles, query = {} }) {
    const { page = 1, limit = 20, status, roomId, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const isManager = userRoles.some(r => ['TENANT_OWNER', 'MANAGER'].includes(r));

    const where = {
      tenantId,
      ...(!isManager && { userId }),
      ...(status && { status }),
      ...(roomId && { roomId }),
      ...(startDate && endDate && {
        startTime: { gte: new Date(startDate) },
        endTime: { lte: new Date(endDate) }
      })
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          room: { select: { name: true, type: true } },
          user: { select: { firstName: true, lastName: true, email: true, avatar: true } },
          desk: { select: { name: true, deskNumber: true } }
        },
        orderBy: { startTime: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.booking.count({ where })
    ]);

    return { bookings, total, page: parseInt(page), limit: parseInt(limit) };
  }

  async getBookingById({ id, tenantId, userId, userRoles }) {
    const isManager = userRoles.some(r => ['TENANT_OWNER', 'MANAGER'].includes(r));

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        tenantId,
        ...(!isManager && { userId })
      },
      include: {
        room: { include: { floor: { include: { building: true } } } },
        user: { select: { firstName: true, lastName: true, email: true, avatar: true } },
        desk: true
      }
    });

    if (!booking) throw Object.assign(new Error('Booking not found'), { statusCode: 404 });
    return booking;
  }

  async approveBooking({ id, tenantId, userId }) {
    const booking = await prisma.booking.findFirst({
      where: { id, tenantId, status: 'PENDING' }
    });

    if (!booking) throw Object.assign(new Error('Booking not found or already processed'), { statusCode: 404 });

    return prisma.booking.update({
      where: { id },
      data: { status: 'CONFIRMED', approvedBy: userId, approvedAt: new Date() }
    });
  }

  async cancelBooking({ id, tenantId, userId, userRoles, reason }) {
    const isManager = userRoles.some(r => ['TENANT_OWNER', 'MANAGER'].includes(r));

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        tenantId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        ...(!isManager && { userId })
      }
    });

    if (!booking) throw Object.assign(new Error('Booking not found or cannot be cancelled'), { statusCode: 404 });

    return prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledBy: userId,
        cancelledAt: new Date(),
        cancelReason: reason
      }
    });
  }

  async getRoomAvailability({ roomId, date, tenantId }) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const room = await prisma.room.findFirst({
      where: { id: roomId, floor: { building: { tenantId } } }
    });

    if (!room) throw Object.assign(new Error('Room not found'), { statusCode: 404 });

    const bookings = await prisma.booking.findMany({
      where: {
        roomId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startTime: { gte: startOfDay },
        endTime: { lte: endOfDay }
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true
      },
      orderBy: { startTime: 'asc' }
    });

    return { room, bookings, date };
  }
}

export const bookingService = new BookingService();
