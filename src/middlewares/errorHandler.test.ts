import request from "supertest";
import express from "express";
import { AppError } from "../utils/AppError";
import { errorHandler } from "../middlewares/errorHandler";

// Nous allons tester le middleware d'erreur de manière isolée
// C'est un "Test d'Intégration" minimaliste
describe("Error Handler Middleware", () => {
  const app = express();

  // Setup d'une route qui plante exprès
  app.get("/error", (req, res, next) => {
    // On simule une erreur métier
    next(new AppError("Test Error Message", 418)); // 418 I'm a teapot
  });

  // On attache le middleware à tester
  app.use(errorHandler);

  it("should catch AppError and return formatted JSON", async () => {
    const res = await request(app).get("/error");

    // Vérification "Senior" :
    // 1. Le status code est respecté ?
    expect(res.status).toBe(418);

    // 2. Le format de réponse est standardisé ?
    expect(res.body).toEqual({
      status: "fail",
      message: "Test Error Message",
    });
  });
});
