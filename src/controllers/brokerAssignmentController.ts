import { Request, Response } from "express";

import { z } from "zod";

export const SendBrokerRequestSchema = z.object({
  ownerId: z.string().uuid("Invalid owner ID"),
});

export const sendBrokerRequestToOwner = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = SendBrokerRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const brokerId = req.user?.id;
    const { ownerId } = req.body;

    if (!ownerId) {
      res.status(400).json({ success: false, message: "ownerId is required" });
      return;
    }

    const assignment = await sendBrokerRequestToOwner(brokerId, ownerId);

    res.status(201).json({ success: true, message: "Request sent to owner successfully", data: assignment });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
