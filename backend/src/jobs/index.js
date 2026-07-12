import { Queue, Worker, QueueScheduler } from 'bullmq'
import IORedis from 'ioredis'
import prisma from '../database/prisma.js'
import { sendSubscriptionReminder } from '../services/email.service.js'
import logger from '../utils/logger.js'

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

// ─── Queues ────────────────────────────────────────────────────────────────
export const emailQueue = new Queue('email', { connection })
export const reportQueue = new Queue('reports', { connection })
export const subscriptionQueue = new Queue('subscriptions', { connection })

// ─── Email Worker ──────────────────────────────────────────────────────────
const emailWorker = new Worker('email', async (job) => {
  const { type, payload } = job.data
  logger.info(`Processing email job: ${type}`)

  switch (type) {
    case 'subscription_reminder':
      await sendSubscriptionReminder(
        payload.email,
        payload.tenantName,
        payload.daysLeft,
        payload.plan
      )
      break
    default:
      logger.warn(`Unknown email job type: ${type}`)
  }
}, { connection, concurrency: 5 })

// ─── Subscription Worker ───────────────────────────────────────────────────
const subscriptionWorker = new Worker('subscriptions', async (job) => {
  const { type } = job.data
  logger.info(`Processing subscription job: ${type}`)

  switch (type) {
    case 'check_expiring':
      await checkExpiringSubscriptions()
      break
    case 'expire_overdue':
      await expireOverdueSubscriptions()
      break
    default:
      logger.warn(`Unknown subscription job: ${type}`)
  }
}, { connection })

// ─── Report Worker ──────────────────────────────────────────────────────────
const reportWorker = new Worker('reports', async (job) => {
  const { type, tenantId } = job.data
  logger.info(`Processing report job: ${type} for tenant ${tenantId}`)

  switch (type) {
    case 'daily_report':
      await generateDailyReport(tenantId)
      break
    case 'weekly_report':
      await generateWeeklyReport(tenantId)
      break
    default:
      logger.warn(`Unknown report job: ${type}`)
  }
}, { connection })

// ─── Job Implementations ───────────────────────────────────────────────────
async function checkExpiringSubscriptions() {
  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const expiringSoon = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      endDate: { gte: now, lte: sevenDaysFromNow },
    },
    include: { tenant: true },
  })

  logger.info(`Found ${expiringSoon.length} subscriptions expiring within 7 days`)

  for (const sub of expiringSoon) {
    const daysLeft = Math.ceil((sub.endDate - now) / (1000 * 60 * 60 * 24))
    await emailQueue.add('subscription-reminder', {
      type: 'subscription_reminder',
      payload: {
        email: sub.tenant.email,
        tenantName: sub.tenant.name,
        daysLeft,
        plan: sub.plan,
      },
    })
  }
}

async function expireOverdueSubscriptions() {
  const result = await prisma.subscription.updateMany({
    where: {
      status: 'ACTIVE',
      endDate: { lt: new Date() },
    },
    data: { status: 'EXPIRED' },
  })
  logger.info(`Expired ${result.count} overdue subscriptions`)
}

async function generateDailyReport(tenantId) {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  const endOfYesterday = new Date(yesterday)
  endOfYesterday.setHours(23, 59, 59, 999)

  const [bookings, revenue] = await Promise.all([
    prisma.booking.count({
      where: { tenantId, createdAt: { gte: yesterday, lte: endOfYesterday } },
    }),
    prisma.booking.aggregate({
      where: { tenantId, status: 'CONFIRMED', createdAt: { gte: yesterday, lte: endOfYesterday } },
      _sum: { totalPrice: true },
    }),
  ])

  logger.info(`Daily report for tenant ${tenantId}: ${bookings} bookings, $${revenue._sum.totalPrice || 0} revenue`)
  return { bookings, revenue: revenue._sum.totalPrice || 0 }
}

async function generateWeeklyReport(tenantId) {
  const lastWeek = new Date()
  lastWeek.setDate(lastWeek.getDate() - 7)

  const [bookings, revenue, newUsers] = await Promise.all([
    prisma.booking.count({ where: { tenantId, createdAt: { gte: lastWeek } } }),
    prisma.booking.aggregate({
      where: { tenantId, status: 'CONFIRMED', createdAt: { gte: lastWeek } },
      _sum: { totalPrice: true },
    }),
    prisma.user.count({ where: { tenantId, createdAt: { gte: lastWeek } } }),
  ])

  logger.info(`Weekly report for tenant ${tenantId}: ${bookings} bookings, $${revenue._sum.totalPrice || 0} revenue, ${newUsers} new users`)
  return { bookings, revenue: revenue._sum.totalPrice || 0, newUsers }
}

// ─── Schedule Recurring Jobs ───────────────────────────────────────────────
export const scheduleRecurringJobs = async () => {
  // Check expiring subscriptions daily at 9am
  await subscriptionQueue.add(
    'check-expiring-daily',
    { type: 'check_expiring' },
    { repeat: { cron: '0 9 * * *' }, removeOnComplete: 100, removeOnFail: 50 }
  )

  // Expire overdue subscriptions daily at midnight
  await subscriptionQueue.add(
    'expire-overdue-midnight',
    { type: 'expire_overdue' },
    { repeat: { cron: '0 0 * * *' }, removeOnComplete: 100, removeOnFail: 50 }
  )

  logger.info('✅ Recurring background jobs scheduled')
}

// Error handlers
for (const worker of [emailWorker, subscriptionWorker, reportWorker]) {
  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed:`, err)
  })
  worker.on('completed', (job) => {
    logger.debug(`Job ${job.id} completed`)
  })
}

export { emailWorker, subscriptionWorker, reportWorker }
