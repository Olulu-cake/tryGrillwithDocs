import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
  
  if (!result.success) {
    const correlationId = (req.headers['x-correlation-id'] as string) || 'unknown';
    
    // Zod's safeParse error object has issues array
    const formattedErrors = result.error.issues.map(issue => ({
      path: issue.path,
      message: issue.message
    }));
    
    return res.status(400).json({ 
      errors: formattedErrors,
      correlationId 
    });
  }

  // Update req with sanitized/transformed data
  if (result.data && (result.data as any).body) req.body = (result.data as any).body;
  if (result.data && (result.data as any).query) req.query = (result.data as any).query;
  if (result.data && (result.data as any).params) req.params = (result.data as any).params;
  
  next();
};
