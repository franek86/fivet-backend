import { z } from "zod";

export const UpdateVerifyUserSchema = z.object({
  userId: z.string().uuid(),
  verificationStatus: z.enum(["PENDING", "VERIFIED", "REJECTED", "SUSPENDED"]),
});

export type UpdateVerifyUserSchema = z.infer<typeof UpdateVerifyUserSchema>;
