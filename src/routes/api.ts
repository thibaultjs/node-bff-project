import { Router } from "express";
import { getDashboardData } from "../controllers/dashboardController";

const router = Router();

// GET /api/dashboard?city=Paris
router.get("/dashboard", getDashboardData);

export default router;
