import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

type Target = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: Target = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {

    const result = schema.safeParse(req[target]);

    if (!result.success) {
      next(result.error); 
      return;
    }
    // In Express v5, req.query has only a getter.
    // To overwrite it, we must redefine the property on the object.
    Object.defineProperty(req, target, {
      value: result.data,
      writable: true,
      configurable: true,
      enumerable: true,
    });

    next();
  };
}
