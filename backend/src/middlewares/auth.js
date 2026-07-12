import { verifyAccessToken } from '../utils/jwt.js';
import prisma from '../database/prisma.js';
import { sendError } from '../utils/response.js';
import logger from '../utils/logger.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } }
              }
            }
          }
        },
        tenant: { select: { id: true, slug: true, name: true, isActive: true } }
      }
    });

    if (!user) return sendError(res, 'User not found', 401);
    if (!user.isActive) return sendError(res, 'Account deactivated', 403);
    if (!user.tenant.isActive) return sendError(res, 'Tenant account suspended', 403);

    // Build permissions set
    const permissions = new Set();
    const roles = [];
    user.userRoles.forEach(({ role }) => {
      roles.push(role.name);
      role.permissions.forEach(({ permission }) => permissions.add(permission.name));
    });

    req.user = {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      permissions: [...permissions]
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Token expired', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid token', 401);
    }
    logger.error('Auth middleware error:', error);
    return sendError(res, 'Authentication failed', 401);
  }
};

export const authorize = (...requiredPermissions) => {
  return (req, res, next) => {
    const userPermissions = new Set(req.user.permissions);
    const hasPermission = requiredPermissions.every(p => userPermissions.has(p));
    
    if (!hasPermission) {
      return sendError(res, 'Insufficient permissions', 403);
    }
    next();
  };
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    const userRoles = new Set(req.user.roles);
    const hasRole = roles.some(r => userRoles.has(r));
    
    if (!hasRole) {
      return sendError(res, 'Access denied', 403);
    }
    next();
  };
};

// Ensure user belongs to the tenant being accessed
export const requireTenantAccess = async (req, res, next) => {
  const tenantSlug = req.params.tenantSlug || req.headers['x-tenant-slug'];
  
  if (!tenantSlug) return next();
  
  if (req.user.tenant?.slug !== tenantSlug && !req.user.roles.includes('SUPER_ADMIN')) {
    return sendError(res, 'Access denied to this tenant', 403);
  }
  
  next();
};
