import { z } from "zod";

export const createCheckoutSchema = z.object({
  plan: z.enum(["STANDARD", "PREMIUM"]),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
