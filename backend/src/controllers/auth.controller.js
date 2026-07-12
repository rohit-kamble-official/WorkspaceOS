import { authService } from '../services/auth.service.js';
import { sendSuccess, sendCreated, sendError } from '../utils/response.js';
import logger from '../utils/logger.js';

export class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.validated.body);
      return sendCreated(res, result, 'Registration successful');
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const result = await authService.login(req.validated.body);
      return sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const result = await authService.refreshTokens(req.validated.body);
      return sendSuccess(res, result, 'Tokens refreshed');
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const result = await authService.logout({
        refreshToken: req.body.refreshToken,
        userId: req.user.id
      });
      return sendSuccess(res, result, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const result = await authService.forgotPassword(req.validated.body);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const result = await authService.resetPassword(req.validated.body);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const result = await authService.verifyEmail({ token: req.query.token });
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      return sendSuccess(res, { user: req.user }, 'Profile retrieved');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
