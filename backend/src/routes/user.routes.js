import { Router } from 'express';
import prisma from '../database/prisma.js';
import bcrypt from 'bcryptjs';
import { authenticate, authorize } from '../middlewares/auth.js';
import { sendSuccess, sendCreated, sendPaginated, buildPaginationMeta } from '../utils/response.js';

const router = Router();

router.get('/', authenticate, authorize('user:read'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      tenantId: req.user.tenantId,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, firstName: true, lastName: true,
          avatar: true, isActive: true, isEmailVerified: true,
          lastLoginAt: true, createdAt: true,
          userRoles: { include: { role: { select: { name: true } } } }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return sendPaginated(res, users, buildPaginationMeta(total, parseInt(page), parseInt(limit)));
  } catch (error) { next(error); }
});

router.post('/', authenticate, authorize('user:create'), async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, roleId } = req.body;

    const existing = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId: req.user.tenantId, email } }
    });
    if (existing) throw Object.assign(new Error('User already exists'), { statusCode: 409 });

    const hashedPassword = await bcrypt.hash(password || 'TempPass123!', 12);

    const user = await prisma.user.create({
      data: {
        tenantId: req.user.tenantId,
        firstName, lastName, email,
        password: hashedPassword,
        isEmailVerified: true
      }
    });

    if (roleId) {
      const role = await prisma.role.findFirst({
        where: { id: roleId, tenantId: req.user.tenantId }
      });
      if (role) {
        await prisma.userRole.create({ data: { userId: user.id, roleId } });
      }
    }

    const { password: _, ...userWithoutPass } = user;
    return sendCreated(res, userWithoutPass, 'User created');
  } catch (error) { next(error); }
});

router.get('/:id', authenticate, authorize('user:read'), async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, avatar: true, isActive: true, isEmailVerified: true,
        lastLoginAt: true, createdAt: true,
        userRoles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
        _count: { select: { bookings: true } }
      }
    });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    return sendSuccess(res, user);
  } catch (error) { next(error); }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    // Users can update themselves; managers can update any user in their tenant
    const isManager = req.user.roles.some(r => ['TENANT_OWNER', 'MANAGER'].includes(r));
    if (req.params.id !== req.user.id && !isManager) {
      throw Object.assign(new Error('Insufficient permissions'), { statusCode: 403 });
    }

    const { firstName, lastName, phone, avatar } = req.body;
    const user = await prisma.user.updateMany({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: { firstName, lastName, phone, avatar }
    });

    return sendSuccess(res, user, 'User updated');
  } catch (error) { next(error); }
});

router.patch('/:id/deactivate', authenticate, authorize('user:delete'), async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      throw Object.assign(new Error('Cannot deactivate your own account'), { statusCode: 400 });
    }
    await prisma.user.updateMany({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: { isActive: false }
    });
    return sendSuccess(res, null, 'User deactivated');
  } catch (error) { next(error); }
});

router.post('/:id/roles', authenticate, authorize('admin:manage'), async (req, res, next) => {
  try {
    const { roleId } = req.body;
    const role = await prisma.role.findFirst({
      where: { id: roleId, tenantId: req.user.tenantId }
    });
    if (!role) throw Object.assign(new Error('Role not found'), { statusCode: 404 });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: req.params.id, roleId } },
      create: { userId: req.params.id, roleId },
      update: {}
    });
    return sendSuccess(res, null, 'Role assigned');
  } catch (error) { next(error); }
});

export default router;
