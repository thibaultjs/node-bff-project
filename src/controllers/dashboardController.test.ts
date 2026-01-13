import request from "supertest";
import express from "express";
import { getDashboardData } from "./dashboardController";
// Imports des services (que nous allons mocker)
import { getCityWeather } from "../services/weatherService";
import { getLocalEvents } from "../services/eventService";
import { getTrafficStatus } from "../services/trafficService";
import { cacheService } from "../services/cacheService";

// --- MOCKING ---
// On dit à Jest : "Ne charge pas les vrais fichiers, utilise des versions fausses que je pilote."
jest.mock("../services/weatherService");
jest.mock("../services/eventService");
jest.mock("../services/trafficService");
jest.mock("../services/cacheService");

// Setup d'une app Express minimaliste juste pour ce test
const app = express();
app.get("/dashboard", getDashboardData);

describe("Dashboard Controller (BFF)", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Nettoyage avant chaque test pour éviter les interférences
  });

  it("should return aggregated data from services when cache is empty", async () => {
    // 1. SETUP: On configure nos mocks pour ce scénario (Happy Path)
    (cacheService.get as jest.Mock).mockReturnValue(undefined); // Cache Miss
    (getCityWeather as jest.Mock).mockResolvedValue({
      temperature: 25,
      condition: "Sunny",
    });
    (getLocalEvents as jest.Mock).mockResolvedValue([
      { id: 1, name: "JsConf", date: "2024" },
    ]);
    (getTrafficStatus as jest.Mock).mockResolvedValue({
      congestionLevel: "low",
    });

    // 2. ACT: On lance la requête
    const res = await request(app).get("/dashboard?city=Lyon");

    // 3. ASSERT: On vérifie le résultat BFF
    expect(res.status).toBe(200);
    // Vérification de la transformation de données (BFF Pattern)
    expect(res.body.data.weather.temp).toBe("25°C");
    expect(res.body.data.traffic.message).toBe("Roads are clear");

    // Vérification Technique Senior : S'assurer que le parallélisme a eu lieu
    expect(getCityWeather).toHaveBeenCalledWith("Lyon");
    expect(getLocalEvents).toHaveBeenCalledWith("Lyon");
    expect(cacheService.set).toHaveBeenCalled(); // On doit avoir mis en cache le résultat
  });

  it("should return cached data immediately if available (Zero API calls)", async () => {
    // 1. SETUP: Le cache contient déjà la donnée
    const mockCachedData = { data: { weather: { temp: "99°C" } } };
    (cacheService.get as jest.Mock).mockReturnValue(mockCachedData);

    // 2. ACT
    const res = await request(app).get("/dashboard?city=Lyon");

    // 3. ASSERT
    expect(res.status).toBe(200);
    expect(res.body.data.weather.temp).toBe("99°C");
    expect(res.body._metadata.cached).toBe(true); // Notre flag de debug

    // Le test ultime : On vérifie qu'AUCUN service n'a été appelé
    expect(getCityWeather).not.toHaveBeenCalled();
    expect(getLocalEvents).not.toHaveBeenCalled();
  });
});
