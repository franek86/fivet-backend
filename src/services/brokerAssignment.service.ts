// services/brokerAssignment.service.ts

import { PrismaClient, AssignmentStatus } from "@prisma/client";

const prisma = new PrismaClient();

export const sendBrokerRequestToOwner = async (brokerId: string, ownerId: string) => {
  // Make sure the requester is actually a broker
  const broker = await prisma.user.findUnique({
    where: {
      id: brokerId,
    },
    select: {
      id: true,
      role: true,
      isActive: true,
    },
  });

  if (!broker) {
    throw new Error("Broker not found");
  }

  if (broker.role !== "BROKER") {
    throw new Error("Only brokers can send owner requests");
  }

  if (!broker.isActive) {
    throw new Error("Your account is not active");
  }

  // Make sure target user is a verified owner
  const owner = await prisma.user.findFirst({
    where: {
      id: ownerId,
      role: "OWNER",
      isActive: true,
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
    throw new Error("Verified owner not found");
  }

  // Check existing relationship
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
      throw new Error("Request is already pending");
    }

    if (existingAssignment.status === AssignmentStatus.ACCEPTED) {
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

  // Create new request
  return prisma.brokerAssignment.create({
    data: {
      brokerId,
      ownerId,
      status: AssignmentStatus.PENDING,
    },
  });
};
