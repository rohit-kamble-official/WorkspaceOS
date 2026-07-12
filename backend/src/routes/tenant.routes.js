import { Router } from 'express';
import prisma from '../database/prisma.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      include: {
        subscriptions: true,
        _count: { select: { users: true, buildings: true, bookings: true } }
      }
    });
    return sendSuccess(res, tenant);
  } catch (error) { next(error); }
});

router.put('/me', authenticate, authorize('admin:manage'), async (req, res, next) => {
  try {
    const { name, phone, address, city, country, timezone } = req.body;
    const tenant = await prisma.tenant.update({
      where: { id: req.user.tenantId },
      data: { name, phone, address, city, country, timezone }
    });
    return sendSuccess(res, tenant, 'Workspace updated');
  } catch (error) { next(error); }
});

router.get('/roles', authenticate, async (req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      where: { tenantId: req.user.tenantId },
      include: { permissions: { include: { permission: true } } }
    });
    return sendSuccess(res, roles);
  } catch (error) { next(error); }
});

export default router;
