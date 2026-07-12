import prisma from '../database/prisma.js'
import bcrypt from 'bcryptjs'
import slugify from 'slugify'
import logger from '../utils/logger.js'
import dotenv from 'dotenv'

import { v4 as uuid } from 'uuid';
dotenv.config()

async function seed() {
  logger.info('🌱 Starting database seed...')

  const hashedPassword = await bcrypt.hash('Demo1234!', 12)

  // ── Create Demo Tenant ────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-workspace' },
    update: {},
    create: {
      name: 'Demo Workspace Inc.',
      slug: 'demo-workspace',
      email: 'admin@demoworkspace.com',
      city: 'San Francisco',
      country: 'USA',
      timezone: 'America/Los_Angeles',
    },
  })
  logger.info(`✅ Tenant: ${tenant.name} (${tenant.slug})`)

  // ── Create Permissions ────────────────────────────────────────────────────
  const permDefs = [
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
  ]

  const permissions = await Promise.all(
    permDefs.map(p => prisma.permission.upsert({ where: { name: p.name }, update: {}, create: p }))
  )
  logger.info(`✅ ${permissions.length} permissions seeded`)

  // ── Create Roles ──────────────────────────────────────────────────────────
  const ownerRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'TENANT_OWNER' } },
    update: {},
    create: { tenantId: tenant.id, name: 'TENANT_OWNER', description: 'Full access', isSystem: true },
  })

  const managerRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'MANAGER' } },
    update: {},
    create: { tenantId: tenant.id, name: 'MANAGER', description: 'Manager access', isSystem: true },
  })

  const employeeRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'EMPLOYEE' } },
    update: {},
    create: { tenantId: tenant.id, name: 'EMPLOYEE', description: 'Employee access', isSystem: true },
  })

  // Assign all permissions to owner
  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: ownerRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: ownerRole.id, permissionId: perm.id },
    })
  }

  // Manager permissions
  const managerPermNames = ['workspace:read', 'workspace:update', 'booking:create', 'booking:read', 'booking:update', 'booking:cancel', 'booking:approve', 'booking:all', 'user:read', 'analytics:view']
  for (const perm of permissions.filter(p => managerPermNames.includes(p.name))) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: managerRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: managerRole.id, permissionId: perm.id },
    })
  }

  // Employee permissions
  const empPermNames = ['workspace:read', 'booking:create', 'booking:read', 'booking:cancel']
  for (const perm of permissions.filter(p => empPermNames.includes(p.name))) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: employeeRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: employeeRole.id, permissionId: perm.id },
    })
  }
  logger.info('✅ Roles and permissions configured')

  // ── Create Demo Users ─────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'demo@example.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'demo@example.com',
      password: hashedPassword,
      firstName: 'Alex',
      lastName: 'Johnson',
      isActive: true,
      isEmailVerified: true,
    },
  })
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: ownerRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: ownerRole.id },
  })

  const managerUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'manager@example.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'manager@example.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Chen',
      isActive: true,
      isEmailVerified: true,
    },
  })
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: managerUser.id, roleId: managerRole.id } },
    update: {},
    create: { userId: managerUser.id, roleId: managerRole.id },
  })

  // Seed 5 employee users
  const employees = [
    { email: 'alice@example.com', firstName: 'Alice', lastName: 'Williams' },
    { email: 'bob@example.com', firstName: 'Bob', lastName: 'Martinez' },
    { email: 'carol@example.com', firstName: 'Carol', lastName: 'Davis' },
    { email: 'dan@example.com', firstName: 'Dan', lastName: 'Kim' },
    { email: 'eve@example.com', firstName: 'Eve', lastName: 'Taylor' },
  ]
  for (const emp of employees) {
    const u = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: emp.email } },
      update: {},
      create: { tenantId: tenant.id, ...emp, password: hashedPassword, isActive: true, isEmailVerified: true },
    })
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: u.id, roleId: employeeRole.id } },
      update: {},
      create: { userId: u.id, roleId: employeeRole.id },
    })
  }
  logger.info('✅ 7 demo users created')

  // ── Create Building & Floors & Rooms ──────────────────────────────────────
  const building = await prisma.building.upsert({
    where: { id: 'seed-building-001' },
    update: {},
    create: {
      id: 'seed-building-001',
      tenantId: tenant.id,
      name: 'HQ Tower',
      address: '100 Market Street',
      city: 'San Francisco',
      country: 'USA',
      totalFloors: 3,
      amenities: ['WiFi', 'Parking', 'Gym', 'Cafeteria', 'Rooftop'],
      isActive: true,
    },
  })

  for (let f = 1; f <= 3; f++) {
    const floor = await prisma.floor.upsert({
      where: { id: `seed-floor-${f}` },
      update: {},
      create: {
        id: `seed-floor-${f}`,
        buildingId: building.id,
        name: `Floor ${f}`,
        floorNumber: f,
        capacity: 40,
        isActive: true,
      },
    })

    const roomTypes = f === 1
      ? [{ name: 'Hot Desk Zone A', type: 'HOT_DESK', capacity: 20, pricePerHour: 5 }, { name: 'Meeting Room Alpha', type: 'MEETING_ROOM', capacity: 8, pricePerHour: 25 }]
      : f === 2
      ? [{ name: 'Private Suite 201', type: 'PRIVATE_CABIN', capacity: 2, pricePerHour: 15 }, { name: 'Conference Hall B', type: 'CONFERENCE_ROOM', capacity: 20, pricePerHour: 50 }]
      : [{ name: 'Executive Cabin 301', type: 'PRIVATE_CABIN', capacity: 1, pricePerHour: 30 }, { name: 'Event Space', type: 'EVENT_SPACE', capacity: 50, pricePerHour: 100 }]

    for (const [ri, rt] of roomTypes.entries()) {
   await prisma.room.create({
  data: {
    floorId: floor.id,
    ...rt,
    pricePerDay: rt.pricePerHour * 8 * 0.8,
    amenities: ['WiFi', 'AC', 'Whiteboard'],
    isActive: true
  }
});
    }
  }
  logger.info('✅ Building, 3 floors, 6 rooms seeded')

  // ── Subscription ──────────────────────────────────────────────────────────
  await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      plan: 'BUSINESS',
      status: 'ACTIVE',
      maxUsers: 100,
      maxBookings: 999,
      maxBuildings: 10,
      pricePerMonth: 149,
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      autoRenew: true,
    },
  })
  logger.info('✅ Business subscription activated')

  // ── Sample Bookings ────────────────────────────────────────────────────────
  const room = await prisma.room.findFirst({ where: { floor: { building: { tenantId: tenant.id } } } })
  if (room) {
    const statuses = ['CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED']
    for (let i = 0; i < 12; i++) {
      const start = new Date()
      start.setDate(start.getDate() - Math.floor(Math.random() * 30))
      start.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0)
      const end = new Date(start)
      end.setHours(start.getHours() + 1 + Math.floor(Math.random() * 3))

      await prisma.booking.create({
        data: {
          tenantId: tenant.id,
          userId: adminUser.id,
          roomId: room.id,
          startTime: start,
          endTime: end,
          status: statuses[i % statuses.length],
          totalPrice: parseFloat(room.pricePerHour) * ((end - start) / 3600000),
          title: `Team Meeting ${i + 1}`,
        },
      })
    }
    logger.info('✅ 12 sample bookings created')
  }

  logger.info('🎉 Seed complete!')
  logger.info('─────────────────────────────────────────')
  logger.info('Demo credentials:')
  logger.info('  Workspace: demo-workspace')
  logger.info('  Owner:   demo@example.com / Demo1234!')
  logger.info('  Manager: manager@example.com / Demo1234!')
}

seed()
  .then(() => prisma.$disconnect())
  .catch((e) => { logger.error('Seed failed:', e); prisma.$disconnect(); process.exit(1) })
