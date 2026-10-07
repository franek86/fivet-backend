import { z } from "zod";

export const ConversationIdSchema = z.string().uuid();

export const SendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().trim().min(1, "Message content is required").max(5000, "Message is too long"),
});
