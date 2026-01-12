import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middlewares/errorHandler";
import { AppError } from "./utils/AppError";
import apiRoutes from "./routes/api";
import { env } from "./config/env";

const app: Application = express();

// Global Middlewares
app.use(helmet());
app.use(cors());
if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use(express.json());

// Health Check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api", apiRoutes);

// Handle 404
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

export default app;
