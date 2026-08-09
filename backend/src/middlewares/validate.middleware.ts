import { NextFunction, Request, Response } from 'express';
import { AnyZodObject } from 'zod';

interface ValidationSchemas {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

/**
 * Validates and (re)assigns req.body/query/params from parsed Zod schemas.
 * Throws ZodError on failure, caught by the centralized error middleware.
 */
export const validate = (schemas: ValidationSchemas) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    if (schemas.query) {
      req.query = schemas.query.parse(req.query) as any;
    }
    if (schemas.params) {
      req.params = schemas.params.parse(req.params) as any;
    }
    next();
  };
};
