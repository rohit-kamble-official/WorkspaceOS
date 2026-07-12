import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';

let io;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000
  });

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication required'));
      
      const decoded = verifyAccessToken(token);
      socket.userId = decoded.userId;
      socket.tenantId = decoded.tenantId;
      socket.userRoles = decoded.roles;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} | User: ${socket.userId}`);

    // Join tenant room for isolation
    socket.join(`tenant:${socket.tenantId}`);
    socket.join(`user:${socket.userId}`);

    socket.on('join:room', (roomId) => {
      socket.join(`room:${roomId}`);
    });

    socket.on('leave:room', (roomId) => {
      socket.leave(`room:${roomId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  logger.info('✅ Socket.io initialized');
  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

// Emit to all users in a tenant
export const emitToTenant = (tenantId, event, data) => {
  if (io) io.to(`tenant:${tenantId}`).emit(event, data);
};

// Emit to specific user
export const emitToUser = (userId, event, data) => {
  if (io) io.to(`user:${userId}`).emit(event, data);
};

// Emit booking update
export const emitBookingUpdate = (tenantId, booking) => {
  emitToTenant(tenantId, 'booking:updated', booking);
};

// Emit desk availability change
export const emitDeskAvailability = (tenantId, roomId, data) => {
  emitToTenant(tenantId, 'desk:availability', { roomId, ...data });
  if (io) io.to(`room:${roomId}`).emit('desk:availability', { roomId, ...data });
};

// Emit notification
export const emitNotification = (userId, notification) => {
  emitToUser(userId, 'notification:new', notification);
};
