import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1. Récupérer le header Authorization
  const authHeader = req.headers.authorization;

  // 2. Vérifier s'il existe et s'il a le bon format (Bearer <token>)
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Unauthorized: Missing or invalid token", 401));
  }

  const token = authHeader.split(" ")[1];

  // 3. Validation simulée (en production, on vérifierait JWT.verify(token, secret))
  if (token !== "secret-admin-token") {
    return next(new AppError("Forbidden: Invalid token", 403));
  }

  // 4. Si tout est bon, on passe
  next();
};
