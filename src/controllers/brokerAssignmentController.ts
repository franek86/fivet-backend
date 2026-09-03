import { Request, Response } from "express";
import { sendBrokerRequestToOwnerService } from "../services/brokerAssignment.service";

import { z } from "zod";
import { logger } from "../config/logger";

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

    const brokerId = req.user?.userId;
    const { ownerId } = req.body;

    if (!ownerId) {
      logger.warn("ownerId is required");
      res.status(400).json({ success: false, message: "ownerId is required" });
      return;
    }

    const assignment = await sendBrokerRequestToOwnerService(brokerId, ownerId);

    res.status(201).json({ success: true, message: "Request sent to owner successfully", data: assignment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
