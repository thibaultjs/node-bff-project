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

  /*
  // --- REAL WORLD IMPLEMENTATION (Fail Fast Pattern) ---
  // Voici comment on coderait ça en PROD avec fetch() :
  
  try {
    const response = await fetch(`https://api.weather.com/v1/geo/${city}`, {
      // PRO TIP : Timeout natif de 3s.
      // Si l'API met 3.1s, la requête est avortée immédiatement.
      signal: AbortSignal.timeout(3000) 
    });
    
    if (!response.ok) throw new Error(`Weather API Error: ${response.status}`);
    return await response.json();

  } catch (error: any) {
     if (error.name === 'AbortError') {
        throw new Error('Weather API Timeout (3000ms limit)');
     }
     throw error;
  }
  */
};
