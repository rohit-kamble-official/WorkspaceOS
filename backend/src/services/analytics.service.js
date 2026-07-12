import prisma from '../database/prisma.js';

export class AnalyticsService {
  async getDashboardStats(tenantId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      totalUsers,
      totalBookings,
      activeBookings,
      monthlyRevenue,
      lastMonthRevenue,
      totalRooms,
      occupancyData
    ] = await Promise.all([
      prisma.user.count({ where: { tenantId, isActive: true } }),
      prisma.booking.count({ where: { tenantId } }),
      prisma.booking.count({ where: { tenantId, status: { in: ['PENDING', 'CONFIRMED'] } } }),
      prisma.booking.aggregate({
        where: { tenantId, status: 'CONFIRMED', createdAt: { gte: startOfMonth } },
        _sum: { totalPrice: true }
      }),
      prisma.booking.aggregate({
        where: { tenantId, status: 'CONFIRMED', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { totalPrice: true }
      }),
      prisma.room.count({
        where: { floor: { building: { tenantId } }, isActive: true }
      }),
      this.getOccupancyRate(tenantId)
    ]);

    const currentRevenue = parseFloat(monthlyRevenue._sum.totalPrice || 0);
    const previousRevenue = parseFloat(lastMonthRevenue._sum.totalPrice || 0);
    const revenueGrowth = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
      : 0;

    return {
      totalUsers,
      totalBookings,
      activeBookings,
      monthlyRevenue: currentRevenue,
      revenueGrowth: parseFloat(revenueGrowth),
      totalRooms,
      occupancyRate: occupancyData.rate
    };
  }

  async getOccupancyRate(tenantId) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const [totalSlots, bookedSlots] = await Promise.all([
      prisma.room.count({ where: { floor: { building: { tenantId } }, isActive: true } }),
      prisma.booking.count({
        where: {
          tenantId,
          status: { in: ['CONFIRMED', 'COMPLETED'] },
          startTime: { gte: startOfWeek }
        }
      })
    ]);

    const rate = totalSlots > 0 ? Math.min(100, (bookedSlots / (totalSlots * 7)) * 100) : 0;
    return { rate: Math.round(rate), bookedSlots, totalSlots };
  }

  async getRevenueChart(tenantId, months = 6) {
    const result = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const revenue = await prisma.booking.aggregate({
        where: { tenantId, status: 'CONFIRMED', createdAt: { gte: start, lte: end } },
        _sum: { totalPrice: true }
      });

      result.push({
        month: start.toLocaleString('default', { month: 'short', year: 'numeric' }),
        revenue: parseFloat(revenue._sum.totalPrice || 0)
      });
    }

    return result;
  }

  async getBookingsByStatus(tenantId) {
    const stats = await prisma.booking.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { status: true }
    });

    return stats.map(s => ({ status: s.status, count: s._count.status }));
  }

  async getTopRooms(tenantId, limit = 5) {
    const rooms = await prisma.booking.groupBy({
      by: ['roomId'],
      where: { tenantId, status: { in: ['CONFIRMED', 'COMPLETED'] } },
      _count: { roomId: true },
      _sum: { totalPrice: true },
      orderBy: { _count: { roomId: 'desc' } },
      take: limit
    });

    const roomDetails = await Promise.all(
      rooms.map(async (r) => {
        const room = await prisma.room.findUnique({
          where: { id: r.roomId },
          select: { name: true, type: true }
        });
        return {
          roomId: r.roomId,
          name: room?.name || 'Unknown',
          type: room?.type || 'UNKNOWN',
          bookings: r._count.roomId,
          revenue: parseFloat(r._sum.totalPrice || 0)
        };
      })
    );

    return roomDetails;
  }

  async getDailyBookings(tenantId, days = 30) {
    const result = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const count = await prisma.booking.count({
        where: { tenantId, createdAt: { gte: date, lte: endDate } }
      });

      result.push({
        date: date.toISOString().split('T')[0],
        bookings: count
      });
    }

    return result;
  }

  async getSubscriptionStatus(tenantId) {
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 5 } }
    });

    return subscription;
  }
}

export const analyticsService = new AnalyticsService();
