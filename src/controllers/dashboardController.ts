import { Request, Response, NextFunction } from "express";
import { getCityWeather } from "../services/weatherService";
import { getLocalEvents } from "../services/eventService";
import { getTrafficStatus } from "../services/trafficService";
import { AppError } from "../utils/AppError";

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

    // --- EXEMPLE MAUVAIS (Séquentiel) ---
    // const weather = await getCityWeather(city); // Attend 500ms
    // const events = await getLocalEvents(city);  // Attend 800ms
    // const traffic = await getTrafficStatus(city); // Attend 300ms
    // Total = 1600ms !! C'est trop long.

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

    res.status(200).json(dashboard);
  } catch (error) {
    // En cas de crash d'un service, on passe l'erreur au Middleware global
    next(error);
  }
};
