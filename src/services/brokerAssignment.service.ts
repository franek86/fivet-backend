// services/brokerAssignment.service.ts
import { PrismaClient, BrokerRequestStatus } from "@prisma/client";
const prisma = new PrismaClient();

import { getIO } from "./socket.service";

import { logger } from "../config/logger";

import { sendUserNotification } from "../controllers/notificationController";

import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../helpers/error.helpers";

type UpdateBrokerRequestStatus = "ACCEPTED" | "REJECTED" | "CANCELLED";

type UpdateBrokerRequestParams = {
  id: string;
  brokerId: string;
  ownerId: string;
  status: UpdateBrokerRequestStatus;
};

/* -------------------------------------------------------------------------- */
/* SEND BROKER REQUEST SERVICE */
/* -------------------------------------------------------------------------- */
export const sendBrokerRequestToOwnerService = async (brokerId: string, ownerId: string) => {
  // 1. Validate broker
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
    throw new NotFoundError("Broker not found");
  }

  if (broker.role !== "BROKER") {
    throw new ForbiddenError("Only brokers can send owner requests");
  }

  // 2. Prevent self request
  if (brokerId === ownerId) {
    throw new ValidationError("A broker cannot send a request to himself.");
  }

  // 3. Validate owner
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
    throw new NotFoundError("Verified owner not found");
  }

  // 4. Check existing broker request
  const existingRequest = await prisma.brokerRequest.findFirst({
    where: {
      brokerId,
      ownerId,
      status: BrokerRequestStatus.PENDING,
    },
    select: {
      id: true,
    },
  });

  if (existingRequest) {
    throw new ConflictError("Request already pending");
  }

  // 5. Check existing connection
  const existingConnection = await prisma.brokerRequest.findFirst({
    where: {
      brokerId,
      ownerId,
      status: BrokerRequestStatus.ACCEPTED,
    },
    select: {
      id: true,
    },
  });

  if (existingConnection) {
    throw new ConflictError("Broker is already connected with this owner.");
  }

  // 6. Create request
  const brokerRequest = await prisma.brokerRequest.create({
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

  // 7. Send notification
  try {
    await sendUserNotification(ownerId, `Broker "${broker.fullName}" wants to connect with you!`, "INFO");

    const io = getIO();

    io.to(`user:${ownerId}`).emit("user:notification:new", {
      data: {
        type: "BROKER_REQUEST",
        assignmentId: brokerRequest.id,
        brokerId,
        ownerId,
      },
    });
  } catch (error) {
    logger.error("Failed to send broker request notification");
  }

  return brokerRequest;
};

/* -------------------------------------------------------------------------- */
/* UPDATE BROKER REQUEST SERVICE */
/* -------------------------------------------------------------------------- */
export const updateBrokerRequestService = async ({ id, brokerId, ownerId, status }: UpdateBrokerRequestParams) => {
  // 1. Find broker
  const brokerRequest = await prisma.brokerRequest.findFirst({
    where: { id, brokerId, ownerId },
    select: {
      id: true,
      brokerId: true,
      ownerId: true,
      status: true,
      broker: { select: { id: true, fullName: true } },
      owner: { select: { id: true, fullName: true } },
    },
  });

  if (!brokerRequest) {
    throw new NotFoundError("Broker request not found.");
  }

  // 2. Validate status
  validateBrokerRequestTransition(brokerRequest.status, status);

  // 3. Reject status
  if (status === BrokerRequestStatus.REJECTED) {
    await prisma.brokerRequest.delete({ where: { id: brokerRequest.id } });
    return { message: "Broker request rejected.", brokerRequest: null, conversation: null };
  }

  // 4. Cancel status
  if (status === BrokerRequestStatus.CANCELLED) {
    await prisma.$transaction(async (tx) => {
      /* * Delete the conversation first because it references * the broker request. */ await tx.conversation.deleteMany({
        where: { brokerRequestId: brokerRequest.id },
      });
      await tx.brokerRequest.delete({ where: { id: brokerRequest.id } });
    });
    return { message: "Broker connection cancelled.", brokerRequest: null, conversation: null };
  }

  // 5.Accept status
  if (status === BrokerRequestStatus.ACCEPTED) {
    const result = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.brokerRequest.update({
        where: { id: brokerRequest.id },
        data: { status: BrokerRequestStatus.ACCEPTED },
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

      // Create conversation for the newly accpeted
      const conversation = await tx.conversation.create({
        data: {
          brokerId: updatedRequest.brokerId,
          ownerId: updatedRequest.ownerId,
          brokerRequestId: updatedRequest.id,
        },
      });
      return { updatedRequest, conversation };
    });

    // 6. DO TO: Notify
    try {
      logger.info(`Broker request ${brokerRequest.id} accepted`);
    } catch (error) {
      logger.error("Failed to send broker request accepted notification");
    }

    return {
      message: "Broker request accepted.",
      brokerRequest: result.updatedRequest,
      conversation: result.conversation,
    };
  }

  throw new ValidationError("Unsupported broker request status.");
};

/* -------------------------------------------------------------------------- */
/* VALIDATE STATUS RULES */
/* -------------------------------------------------------------------------- */
const validateBrokerRequestTransition = (currentStatus: BrokerRequestStatus, newStatus: UpdateBrokerRequestStatus): void => {
  const allowedTransitions: Record<BrokerRequestStatus, BrokerRequestStatus[]> = {
    [BrokerRequestStatus.PENDING]: [BrokerRequestStatus.ACCEPTED, BrokerRequestStatus.REJECTED],
    [BrokerRequestStatus.ACCEPTED]: [BrokerRequestStatus.CANCELLED],
    [BrokerRequestStatus.REJECTED]: [],
    [BrokerRequestStatus.CANCELLED]: [],
  };
  const allowedStatuses = allowedTransitions[currentStatus] ?? [];
  if (!allowedStatuses.includes(newStatus)) {
    throw new ValidationError(`Cannot change broker request from ${currentStatus} to ${newStatus}.`);
  }
};
