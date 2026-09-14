import { Request, Response } from "express";
import { sendBrokerRequestToOwnerService } from "../services/brokerAssignment.service";

import { z } from "zod";
import { logger } from "../config/logger";
import prisma from "../prismaClient";

export const SendBrokerRequestSchema = z.object({
  ownerId: z.string().uuid("Invalid owner ID"),
});

export const EditBrokerRequestToUserSchema = z.object({
  brokerId: z.string().uuid("Invalid broker ID"),
  status: z.string().min(1),
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

/* Update broker request by user - accpeted or rejected */
export const editBrokerRequestToUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = req.user?.userId;

    if (!ownerId) {
      logger.warn("ownerId is required");
      res.status(400).json({ success: false, message: "ownerId is required" });
      return;
    }

    const parsed = EditBrokerRequestToUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { brokerId, status } = req.body;
    const updateBrokerRequest = await prisma.brokerRequest.findFirst({
      where: {
        brokerId,
        ownerId,
        status: "PENDING",
      },
    });

    if (!updateBrokerRequest) {
      throw new Error("Broker request not found");
    }

    const result = await prisma.brokerRequest.update({
      where: { id: updateBrokerRequest.id },
      data: {
        status: status,
      },
    });

    res.status(200).json({ message: "Request accpetd", result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
