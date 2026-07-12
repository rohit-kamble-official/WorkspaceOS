import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import prisma from '../database/prisma.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { sendWelcomeEmail, sendPasswordResetEmail, sendEmailVerification } from './email.service.js';
import logger from '../utils/logger.js';

export class AuthService {
  async register({ firstName, lastName, email, password, tenantName, tenantSlug }) {
    // Generate slug if not provided
    const slug = tenantSlug || slugify(tenantName, { lower: true, strict: true });

    // Check slug availability
    const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
    if (existingTenant) {
      throw Object.assign(new Error('This workspace URL is already taken'), { statusCode: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const emailVerifyToken = uuidv4();

    // Create tenant, user, roles, subscription in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: { name: tenantName, slug, email }
      });

      // Create default roles
      const [ownerRole, managerRole, employeeRole] = await Promise.all([
        tx.role.create({ data: { tenantId: tenant.id, name: 'TENANT_OWNER', description: 'Full access to tenant', isSystem: true } }),
        tx.role.create({ data: { tenantId: tenant.id, name: 'MANAGER', description: 'Manager access', isSystem: true } }),
        tx.role.create({ data: { tenantId: tenant.id, name: 'EMPLOYEE', description: 'Basic employee access', isSystem: true } })
      ]);

      // Create default permissions and assign to roles
      await this._seedPermissions(tx, tenant.id, ownerRole.id, managerRole.id, employeeRole.id);

      // Create owner user
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email,
          password: hashedPassword,
          firstName,
          lastName,
          emailVerifyToken,
        }
      });

      // Assign owner role
      await tx.userRole.create({ data: { userId: user.id, roleId: ownerRole.id } });

      // Create free subscription
      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          plan: 'FREE',
          status: 'ACTIVE',
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });

      return { tenant, user };
    });

    // Send verification email (non-blocking)
    sendEmailVerification(result.user.email, emailVerifyToken, result.tenant.slug).catch(
      (e) => logger.error('Email send failed:', e)
    );

    return {
      message: 'Account created successfully. Please verify your email.',
      tenantSlug: result.tenant.slug
    };
  }

  async login({ email, password, tenantSlug }) {
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant || !tenant.isActive) {
      throw Object.assign(new Error('Workspace not found or suspended'), { statusCode: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } }
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
    }

    if (!user.isActive) {
      throw Object.assign(new Error('Account is deactivated'), { statusCode: 403 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
    }

    const roles = user.userRoles.map(ur => ur.role.name);
    const permissions = [...new Set(
      user.userRoles.flatMap(ur => ur.role.permissions.map(rp => rp.permission.name))
    )];

    const tokenPayload = {
      userId: user.id,
      tenantId: tenant.id,
      email: user.email,
      roles
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        roles,
        permissions
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logo: tenant.logo
      }
    };
  }

  async refreshTokens({ refreshToken }) {
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
      throw Object.assign(new Error('Invalid or expired refresh token'), { statusCode: 401 });
    }

    const decoded = verifyRefreshToken(refreshToken);

    // Revoke old token (rotation)
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { isRevoked: true }
    });

    const tokenPayload = {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      email: decoded.email,
      roles: decoded.roles
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    await prisma.refreshToken.create({
      data: {
        userId: stored.userId,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout({ refreshToken, userId }) {
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken, userId },
        data: { isRevoked: true }
      });
    }
    return { message: 'Logged out successfully' };
  }

  async forgotPassword({ email, tenantSlug }) {
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw Object.assign(new Error('Workspace not found'), { statusCode: 404 });

    const user = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email } }
    });

    // Always return success (security: don't reveal if email exists)
    if (!user) return { message: 'If this email exists, a reset link has been sent' };

    const token = uuidv4();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpiry: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      }
    });

    sendPasswordResetEmail(email, token, tenant.slug).catch(e => logger.error('Reset email failed:', e));

    return { message: 'If this email exists, a reset link has been sent' };
  }

  async resetPassword({ token, password }) {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpiry: { gt: new Date() }
      }
    });

    if (!user) {
      throw Object.assign(new Error('Invalid or expired reset token'), { statusCode: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpiry: null
      }
    });

    // Revoke all refresh tokens
    await prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { isRevoked: true }
    });

    return { message: 'Password reset successfully' };
  }

  async verifyEmail({ token }) {
    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token }
    });

    if (!user) {
      throw Object.assign(new Error('Invalid verification token'), { statusCode: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerifyToken: null }
    });

    return { message: 'Email verified successfully' };
  }

  async _seedPermissions(tx, tenantId, ownerRoleId, managerRoleId, employeeRoleId) {
    const permissions = [
      { name: 'workspace:create', resource: 'workspace', action: 'create' },
      { name: 'workspace:read', resource: 'workspace', action: 'read' },
      { name: 'workspace:update', resource: 'workspace', action: 'update' },
      { name: 'workspace:delete', resource: 'workspace', action: 'delete' },
      { name: 'booking:create', resource: 'booking', action: 'create' },
      { name: 'booking:read', resource: 'booking', action: 'read' },
      { name: 'booking:update', resource: 'booking', action: 'update' },
      { name: 'booking:cancel', resource: 'booking', action: 'cancel' },
      { name: 'booking:approve', resource: 'booking', action: 'approve' },
      { name: 'booking:all', resource: 'booking', action: 'read_all' },
      { name: 'user:create', resource: 'user', action: 'create' },
      { name: 'user:read', resource: 'user', action: 'read' },
      { name: 'user:update', resource: 'user', action: 'update' },
      { name: 'user:delete', resource: 'user', action: 'delete' },
      { name: 'billing:view', resource: 'billing', action: 'read' },
      { name: 'billing:manage', resource: 'billing', action: 'manage' },
      { name: 'analytics:view', resource: 'analytics', action: 'read' },
      { name: 'admin:manage', resource: 'admin', action: 'manage' },
    ];

    for (const perm of permissions) {
      const existing = await tx.permission.findUnique({ where: { name: perm.name } });
      if (!existing) {
        await tx.permission.create({ data: perm });
      }
    }

    // Owner gets all permissions
    const allPerms = await tx.permission.findMany();
    for (const perm of allPerms) {
      await tx.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: ownerRoleId, permissionId: perm.id } },
        create: { roleId: ownerRoleId, permissionId: perm.id },
        update: {}
      });
    }

    // Manager gets workspace + booking permissions
    const managerPerms = allPerms.filter(p => 
      ['workspace:read', 'workspace:update', 'booking:create', 'booking:read', 'booking:update', 
       'booking:cancel', 'booking:approve', 'booking:all', 'user:read', 'analytics:view'].includes(p.name)
    );
    for (const perm of managerPerms) {
      await tx.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: managerRoleId, permissionId: perm.id } },
        create: { roleId: managerRoleId, permissionId: perm.id },
        update: {}
      });
    }

    // Employee gets basic permissions
    const employeePerms = allPerms.filter(p =>
      ['workspace:read', 'booking:create', 'booking:read', 'booking:cancel'].includes(p.name)
    );
    for (const perm of employeePerms) {
      await tx.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: employeeRoleId, permissionId: perm.id } },
        create: { roleId: employeeRoleId, permissionId: perm.id },
        update: {}
      });
    }
  }
}

export const authService = new AuthService();
