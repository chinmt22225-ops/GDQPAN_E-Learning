import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((e) => e.message).join(', ');
        res.status(400).json({
          success: false,
          message: errorMessages,
          errors: error.errors,
        });
        return;
      }
      res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ.' });
    }
  };
};
