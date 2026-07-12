import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    issuer: 'workspace-saas',
    audience: 'workspace-saas-client'
  });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(
    { ...payload, jti: uuidv4() },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
      issuer: 'workspace-saas'
    }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
    issuer: 'workspace-saas',
    audience: 'workspace-saas-client'
  });
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
    issuer: 'workspace-saas'
  });
};

export const decodeToken = (token) => {
  return jwt.decode(token);
};
