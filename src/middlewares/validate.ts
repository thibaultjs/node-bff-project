import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";
import { AppError } from "../utils/AppError";

export const validate =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      // Access .issues instead of .errors
      const errorMessages = result.error.issues
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      return next(new AppError(`Validation Error: ${errorMessages}`, 400));
    }

    next();
  };
