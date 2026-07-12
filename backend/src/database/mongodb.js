import mongoose from 'mongoose';
import logger from '../utils/logger.js';

export const connectMongoDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/workspace_saas_logs';
    await mongoose.connect(mongoUri);
    logger.info('✅ MongoDB connected successfully');
  } catch (error) {
    logger.warn('⚠️ MongoDB connection failed (non-critical):', error.message);
  }
};

// Activity Log Schema
const activityLogSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  userId: String,
  action: { type: String, required: true },
  resource: String,
  resourceId: String,
  details: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  createdAt: { type: Date, default: Date.now, expires: '90d' }
});

// Audit Log Schema
const auditLogSchema = new mongoose.Schema({
  tenantId: { type: String, index: true },
  userId: String,
  action: String,
  tableName: String,
  recordId: String,
  oldValues: mongoose.Schema.Types.Mixed,
  newValues: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  createdAt: { type: Date, default: Date.now, expires: '365d' }
});

// System Log Schema
const systemLogSchema = new mongoose.Schema({
  level: String,
  message: String,
  service: String,
  details: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now, expires: '30d' }
});

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export const SystemLog = mongoose.model('SystemLog', systemLogSchema);
