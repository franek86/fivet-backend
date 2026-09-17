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

    const { brokerId, id, status } = req.body;
    const findBrokerRequest = await prisma.brokerRequest.findFirst({
      where: {
        id,
        brokerId,
        ownerId,
      },
    });

    if (!findBrokerRequest) {
      throw new Error("Broker request not found");
    }

    const currentStatus = findBrokerRequest.status;

    const isValidTransition =
      (currentStatus === "PENDING" && ["ACCEPTED", "REJECTED"].includes(status)) ||
      (currentStatus === "ACCEPTED" && status === "CANCELLED");

    if (!isValidTransition) {
      res.status(400).json({
        success: false,
        message: "Invalid status transition",
      });
      return;
    }

    // Reject → delete
    if (status === "REJECTED") {
      await prisma.brokerRequest.delete({
        where: {
          id: findBrokerRequest.id,
        },
      });

      res.status(200).json({
        success: true,
        message: "Request rejected",
      });

      return;
    }

    // Cancel → delete
    /* if (status === "CANCELLED") {
      await prisma.brokerRequest.delete({
        where: {
          id: findBrokerRequest.id,
        },
      });

      res.status(200).json({
        success: true,
        message: "Request cancelled",
      });

      return;
    } */

    if (status === "CANCELLED") {
      await prisma.$transaction(async (tx) => {
        await tx.conversation.deleteMany({
          where: {
            brokerRequestId: findBrokerRequest.id,
          },
        });

        await tx.brokerRequest.delete({
          where: {
            id: findBrokerRequest.id,
          },
        });
      });

      res.status(200).json({
        success: true,
        message: "Broker connection cancelled",
      });

      return;
    }

    // ACCEPTED → update
    const result = await prisma.brokerRequest.update({
      where: {
        id: findBrokerRequest.id,
      },
      data: {
        status: "ACCEPTED",
      },
    });

    // Only create conversation when request is ACCEPTED
    let conversation = null;

    if (findBrokerRequest.status === "PENDING" && status === "ACCEPTED") {
      conversation = await prisma.conversation.create({
        data: {
          ownerId: result.ownerId,
          brokerId: result.brokerId,
          brokerRequestId: result.id,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Request ${status.toLowerCase()}`,
      brokerRequest: result,
      conversation,
    });

    res.status(200).json({ message: "Request accpeted", conversation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
