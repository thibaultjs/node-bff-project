import { Request, Response, NextFunction } from "express";
import { getCityWeather } from "../services/weatherService";
import { getLocalEvents } from "../services/eventService";
import { getTrafficStatus } from "../services/trafficService";
import { AppError } from "../utils/AppError";
import { cacheService } from "../services/cacheService";

export const getDashboardData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // On récupère la ville depuis les Query Params (?city=Paris)
    const city = req.query.city as string;

    if (!city) {
      return next(new AppError("Please provide a city in query params", 400));
    }

    // --- STRATÉGIE DE CACHE (Redis-like) ---
    const cacheKey = `dashboard:${city.toLowerCase()}`;
    const cachedData = cacheService.get(cacheKey);

    if (cachedData) {
      // Si trouvé en cache, on retourne la réponse tout de suite (0ms de latence API tierce)
      res.status(200).json({
        ...cachedData as object,
        _metadata: { cached: true, timestamp: new Date().toISOString() } // Petit flag pour debug
      });
      return; // Important : on s'arrête là
    }

    // --- EXEMPLE BON (Parallèle / Concurrency) ---
    // On lance les 3 promesses en même temps. Elles partent dans l'Event Loop.
    // On attend que TOUTES soient finies.
    // Temps total = le plus lent des 3 (800ms). On a gagné 50% de perf.

    const [weather, events, traffic] = await Promise.all([
      getCityWeather(city),
      getLocalEvents(city),
      getTrafficStatus(city),
    ]);

    // La logique BFF : On formate et agrège ici
    const dashboard = {
      meta: {
        city: city,
        requestTime: new Date().toISOString(),
        source: "CityGuide BFF",
      },
      data: {
        weather: {
          temp: `${weather.temperature}°C`, // Formatage pour le Front
          status: weather.condition,
        },
        traffic: {
          level: traffic.congestionLevel,
          message:
            traffic.congestionLevel === "high"
              ? "Take the subway!"
              : "Roads are clear",
        },
        events: events.slice(0, 2), // On limite à 2 events pour le mobile
      },
    };

    // On sauvegarde en cache pour 60 secondes (défaut)
    cacheService.set(cacheKey, dashboard);

    res.status(200).json(dashboard);
  } catch (error) {
    // En cas de crash d'un service, on passe l'erreur au Middleware global
    next(error);
  }
};
