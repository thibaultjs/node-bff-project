interface TrafficData {
  congestionLevel: "low" | "moderate" | "high";
  averageSpeed: number; // km/h
}

export const getTrafficStatus = async (city: string): Promise<TrafficData> => {
  // Simulation appel API Traffic (ex: Google Maps)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        congestionLevel: "moderate",
        averageSpeed: 35,
      });
    }, 300); // Rapide
  });
};
