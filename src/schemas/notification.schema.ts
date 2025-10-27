import { z } from "zod";

export const UpdateNotificationSchema = z.object({
  isRead: z.boolean(),
});

export type UpdateNotificationInput = z.infer<typeof UpdateNotificationSchema>;
