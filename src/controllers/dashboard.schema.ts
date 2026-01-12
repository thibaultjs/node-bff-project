import { z } from "zod";

export const dashboardSchema = z.object({
  query: z.object({
    city: z.string().min(2, "City name must be at least 2 characters long"),
  }),
});
