// services/brokerAssignment.service.ts

import { PrismaClient, AssignmentStatus, BrokerRequestStatus } from "@prisma/client";
import { getIO } from "./socket.service";
import { logger } from "../config/logger";
import { sendUserNotification } from "../controllers/notificationController";

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
  const existingRequest = await prisma.brokerRequest.findFirst({
    where: {
      brokerId,
      ownerId,
      status: BrokerRequestStatus.PENDING,
    },
  });

  if (existingRequest) {
    throw new Error("Request already pending");
  }

  /*
    Create or reactivate request
  */

  const result = await prisma.brokerRequest.create({
    data: {
      brokerId,
      ownerId,
      status: BrokerRequestStatus.PENDING,
    },
    include: {
      broker: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      owner: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  // --------------------------------------------------
  // 8. Send realtime notification AFTER DB commit
  // --------------------------------------------------

  await sendUserNotification(ownerId, `Broker "${broker.fullName}" wants to connect with you!`, "INFO");
  const io = getIO();

  io.to(`user:${ownerId}`).emit("user:notification:new", {
    data: {
      type: "BROKER_REQUEST",
      assignmentId: result.id,
      brokerId,
      ownerId,
    },
  });

  return result;

  /* return prisma.brokerAssignment.create({
    data: {
      brokerId,
      ownerId,
      status: AssignmentStatus.PENDING,
    },
  }); */
};
