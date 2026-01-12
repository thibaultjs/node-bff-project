import { Router } from "express";
import { getDashboardData } from "../controllers/dashboardController";
import { validate } from "../middlewares/validate";
import { dashboardSchema } from "../controllers/dashboard.schema";
import { requireAuth } from "../middlewares/auth";

const router = Router();

// GET /api/dashboard?city=Paris
// Pipeline: Auth -> Validation -> Controller
router.get(
  "/dashboard",
  requireAuth,
  validate(dashboardSchema),
  getDashboardData
);

export default router;
