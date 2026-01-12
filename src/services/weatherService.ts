interface WeatherData {
  temperature: number; // Celsius
  condition: string;
  humidity: number;
}

export const getCityWeather = async (city: string): Promise<WeatherData> => {
  // Simulation d'un appel API qui prend du temps (ex: OpenWeatherMap)
  // En Node, cet "await" ne bloque pas le serveur pour les autres utilisateurs.
  // L'Event Loop note "rappelle-moi dans 500ms" et passe à autre chose.
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        temperature: 22,
        condition: "Sunny",
        humidity: 45,
      });
    }, 500); // 500ms de latence simulée
  });
};
