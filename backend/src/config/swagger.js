import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WorkspaceOS API',
      version: '1.0.0',
      description: 'Enterprise Multi-Tenant Workspace Management System API',
      contact: {
        name: 'WorkspaceOS Team',
        email: 'api@workspaceos.com'
      }
    },
    servers: [
      { url: `http://localhost:${process.env.PORT || 5000}/api`, description: 'Development' },
      { url: 'https://api.workspaceos.com', description: 'Production' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        Tenant: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
            email: { type: 'string', format: 'email' },
            isActive: { type: 'boolean' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            roles: { type: 'array', items: { type: 'string' } }
          }
        },
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] },
            totalPrice: { type: 'number' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js']
};

export const swaggerSpec = swaggerJsdoc(options);
