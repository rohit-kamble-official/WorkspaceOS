import { Router } from 'express';
import prisma from '../database/prisma.js';
import { authenticate } from '../middlewares/auth.js';
import { sendSuccess, sendPaginated, buildPaginationMeta } from '../utils/response.js';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId: req.user.id,
      tenantId: req.user.tenantId,
      ...(unread === 'true' && { isRead: false })
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.notification.count({ where })
    ]);

    return sendPaginated(res, notifications, buildPaginationMeta(total, parseInt(page), parseInt(limit)));
  } catch (error) { next(error); }
});

router.patch('/read-all', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, tenantId: req.user.tenantId, isRead: false },
      data: { isRead: true }
    });
    return sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) { next(error); }
});

router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { isRead: true }
    });
    return sendSuccess(res, null, 'Notification marked as read');
  } catch (error) { next(error); }
});

export default router;
