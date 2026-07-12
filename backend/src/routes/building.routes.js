import { Router } from 'express';
import prisma from '../database/prisma.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { sendSuccess, sendCreated, sendPaginated, buildPaginationMeta } from '../utils/response.js';

const router = Router();

router.get('/', authenticate, authorize('workspace:read'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [buildings, total] = await Promise.all([
      prisma.building.findMany({
        where: { tenantId: req.user.tenantId, isActive: true },
        include: {
          floors: {
            include: { rooms: { include: { desks: true } } }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.building.count({ where: { tenantId: req.user.tenantId, isActive: true } })
    ]);

    return sendPaginated(res, buildings, buildPaginationMeta(total, parseInt(page), parseInt(limit)));
  } catch (error) { next(error); }
});

router.post('/', authenticate, authorize('workspace:create'), async (req, res, next) => {
  try {
    const { name, address, city, country, totalFloors, amenities } = req.body;
    const building = await prisma.building.create({
      data: {
        tenantId: req.user.tenantId,
        name, address, city, country,
        totalFloors: totalFloors || 1,
        amenities: amenities || []
      }
    });
    return sendCreated(res, building, 'Building created');
  } catch (error) { next(error); }
});

router.get('/:id', authenticate, authorize('workspace:read'), async (req, res, next) => {
  try {
    const building = await prisma.building.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      include: {
        floors: {
          include: {
            rooms: {
              include: {
                desks: true,
                _count: { select: { bookings: true } }
              }
            }
          }
        }
      }
    });
    if (!building) throw Object.assign(new Error('Building not found'), { statusCode: 404 });
    return sendSuccess(res, building);
  } catch (error) { next(error); }
});

router.put('/:id', authenticate, authorize('workspace:update'), async (req, res, next) => {
  try {
    const building = await prisma.building.updateMany({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: req.body
    });
    return sendSuccess(res, building, 'Building updated');
  } catch (error) { next(error); }
});

router.delete('/:id', authenticate, authorize('workspace:delete'), async (req, res, next) => {
  try {
    await prisma.building.updateMany({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: { isActive: false }
    });
    return sendSuccess(res, null, 'Building deactivated');
  } catch (error) { next(error); }
});

// Floors
router.post('/:buildingId/floors', authenticate, authorize('workspace:create'), async (req, res, next) => {
  try {
    const building = await prisma.building.findFirst({
      where: { id: req.params.buildingId, tenantId: req.user.tenantId }
    });
    if (!building) throw Object.assign(new Error('Building not found'), { statusCode: 404 });

    const floor = await prisma.floor.create({
      data: {
        buildingId: req.params.buildingId,
        name: req.body.name,
        floorNumber: req.body.floorNumber,
        capacity: req.body.capacity || 0
      }
    });
    return sendCreated(res, floor, 'Floor created');
  } catch (error) { next(error); }
});

// Rooms
router.post('/:buildingId/floors/:floorId/rooms', authenticate, authorize('workspace:create'), async (req, res, next) => {
  try {
    const { name, type, capacity, pricePerHour, pricePerDay, amenities, description } = req.body;
    const room = await prisma.room.create({
      data: {
        floorId: req.params.floorId,
        name, type, capacity,
        pricePerHour: pricePerHour || 0,
        pricePerDay: pricePerDay || 0,
        amenities: amenities || [],
        description
      }
    });
    return sendCreated(res, room, 'Room created');
  } catch (error) { next(error); }
});

export default router;
