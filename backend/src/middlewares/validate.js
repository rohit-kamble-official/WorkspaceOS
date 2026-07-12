import { sendError } from '../utils/response.js';

export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params
      });

      if (!result.success) {
        const errors = result.error.issues.map(issue => ({
          field: issue.path.slice(1).join('.'),
          message: issue.message
        }));

        return sendError(res, 'Validation failed', 400, errors);
      }

      req.validated = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};