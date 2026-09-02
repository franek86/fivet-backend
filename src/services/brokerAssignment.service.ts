// services/brokerAssignment.service.ts

import { PrismaClient, AssignmentStatus, NotificationType } from "@prisma/client";
import { getIO } from "./socket.service";
import { logger } from "../config/logger";

const prisma = new PrismaClient();

export const sendBrokerRequestToOwnerService = async (brokerId: string, ownerId: string) => {
  /* 
    Check broker
  */

  const broker = await prisma.user.findUnique({
    where: {
      id: brokerId,
    },
    select: {
      id: true,
      role: true,
      fullName: true,
    },
  });

  if (!broker) {
    logger.warn("Broker not found");
    throw new Error("Broker not found");
  }

  if (broker.role !== "BROKER") {
    logger.warn("Only brokers can send owner requests");
    throw new Error("Only brokers can send owner requests");
  }

  /* 
    Check verified owner
  */
  const owner = await prisma.user.findFirst({
    where: {
      id: ownerId,
      role: "OWNER",
      ownerProfile: {
        verificationStatus: "VERIFIED",
      },
    },
    select: {
      id: true,
      fullName: true,
      ownerProfile: {
        select: {
          verificationStatus: true,
        },
      },
    },
  });

  if (!owner) {
    logger.warn("Verified owner not found");
    throw new Error("Verified owner not found");
  }

  /* 
    Check existing relationship 
  */
  const existingAssignment = await prisma.brokerAssignment.findUnique({
    where: {
      ownerId_brokerId: {
        ownerId,
        brokerId,
      },
    },
  });

  if (existingAssignment) {
    if (existingAssignment.status === AssignmentStatus.PENDING) {
      logger.warn("Request is already pending");
      throw new Error("Request is already pending");
    }

    if (existingAssignment.status === AssignmentStatus.ACCEPTED) {
      logger.warn("You are already connected with this owner");
      throw new Error("You are already connected with this owner");
    }

    if (existingAssignment.status === AssignmentStatus.REVOKED) {
      // You can decide whether revoked relationships can be requested again.
      // Here we allow a new request by resetting it to PENDING.
      return prisma.brokerAssignment.update({
        where: {
          id: existingAssignment.id,
        },
        data: {
          status: AssignmentStatus.PENDING,
        },
      });
    }

    if (existingAssignment.status === AssignmentStatus.DECLINED) {
      return prisma.brokerAssignment.update({
        where: {
          id: existingAssignment.id,
        },
        data: {
          status: AssignmentStatus.PENDING,
        },
      });
    }
  }

  /*
    Create or reactivate request
  */
  const result = await prisma.$transaction(async (tx) => {
    let assignment;

    if (existingAssignment) {
      assignment = await tx.brokerAssignment.update({
        where: {
          id: existingAssignment.id,
        },
        data: {
          status: AssignmentStatus.PENDING,
          updatedAt: new Date(),
        },
      });
    } else {
      assignment = await tx.brokerAssignment.create({
        data: {
          brokerId,
          ownerId,
          status: AssignmentStatus.PENDING,
        },
      });
    }

    /* Save notification */
    const notification = await tx.notification.create({
      data: {
        userId: ownerId,
        type: NotificationType.INFO,
        message: `${broker.fullName} sent you a broker connection request.`,
      },
    });

    return {
      assignment,
      notification,
    };
  });

  // --------------------------------------------------
  // 8. Send realtime notification AFTER DB commit
  // --------------------------------------------------

  const io = getIO();

  io.to(`user:${ownerId}`).emit("notification:new", {
    id: result.notification.id,
    type: result.notification.type,
    message: result.notification.message,
    isRead: result.notification.isRead,
    createdAt: result.notification.createdAt,

    // Useful for frontend navigation
    data: {
      type: "BROKER_REQUEST",
      assignmentId: result.assignment.id,
      brokerId,
      ownerId,
    },
  });

  return result.assignment;

  /* return prisma.brokerAssignment.create({
    data: {
      brokerId,
      ownerId,
      status: AssignmentStatus.PENDING,
    },
  }); */
};
