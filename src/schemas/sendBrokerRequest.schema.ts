import { z } from "zod";

export const SendBrokerRequestSchema = z.object({
  ownerId: z.string().uuid("Invalid owner ID"),
});

export const EditBrokerRequestSchema = z.object({
  id: z.string().uuid("Invalid broker request ID"),
  brokerId: z.string().uuid("Invalid broker ID"),
  status: z.enum(["ACCEPTED", "REJECTED", "CANCELLED"], { message: "Invalid broker request status" }),
});

export type SendBrokerRequestInput = z.infer<typeof SendBrokerRequestSchema>;
export type EditBrokerRequestInput = z.infer<typeof EditBrokerRequestSchema>;
