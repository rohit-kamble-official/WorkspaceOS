import prisma from '../database/prisma.js';
import { sendError } from '../utils/response.js';
import logger from '../utils/logger.js';

export const resolveTenant = async (req, res, next) => {
  try {
    const tenantSlug = 
      req.params.tenantSlug || 
      req.headers['x-tenant-slug'] || 
      req.query.tenant;

    if (!tenantSlug) {
      return next();
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      include: {
        subscriptions: {
          select: {
            plan: true,
            status: true,
            endDate: true,
            maxUsers: true,
            maxBookings: true,
            maxBuildings: true
          }
        }
      }
    });

    if (!tenant) {
      return sendError(res, `Tenant '${tenantSlug}' not found`, 404);
    }

    if (!tenant.isActive) {
      return sendError(res, 'This workspace is currently suspended', 403);
    }

    req.tenant = tenant;
    req.tenantId = tenant.id;
    next();
  } catch (error) {
    logger.error('Tenant resolution error:', error);
    return sendError(res, 'Failed to resolve workspace', 500);
  }
};
