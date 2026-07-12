import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema
} from '../validators/auth.validator.js';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new tenant and owner account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password, tenantName]
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               tenantName: { type: string }
 *     responses:
 *       201: { description: Registration successful }
 *       409: { description: Workspace URL already taken }
 */
router.post('/register', validate(registerSchema), authController.register.bind(authController));

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login to a tenant workspace
 */
router.post('/login', validate(loginSchema), authController.login.bind(authController));

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token using refresh token
 */
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken.bind(authController));

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout and revoke refresh token
 *     security: [{ bearerAuth: [] }]
 */
router.post('/logout', authenticate, authController.logout.bind(authController));

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Request password reset email
 */
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword.bind(authController));

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Reset password with token
 */
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword.bind(authController));

/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     tags: [Authentication]
 *     summary: Verify email address
 */
router.get('/verify-email', authController.verifyEmail.bind(authController));

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current user profile
 *     security: [{ bearerAuth: [] }]
 */
router.get('/me', authenticate, authController.me.bind(authController));

export default router;
