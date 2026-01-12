interface EventData {
  title: string;
  date: string;
  venue: string;
}

export const getLocalEvents = async (city: string): Promise<EventData[]> => {
  // Simulation appel API Events (ex: Ticketmaster)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          title: "Jazz Festival",
          date: new Date().toISOString(),
          venue: "Central Park",
        },
        {
          title: "Tech Meetup",
          date: new Date().toISOString(),
          venue: "Convention Center",
        },
      ]);
    }, 800); // Un peu plus lent
  });
};
