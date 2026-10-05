import { NextFunction, Request, Response } from "express";

import { EditBrokerRequestSchema, SendBrokerRequestSchema } from "../schemas/sendBrokerRequest.schema";
import { sendBrokerRequestToOwnerService, updateBrokerRequestService } from "../services/brokerAssignment.service";
import { AuthError, ValidationError } from "../helpers/error.helpers";

/* -------------------------------------------------------------------------- */
/* SEND BROKER REQUEST TO USER */
/* -------------------------------------------------------------------------- */
export const sendBrokerRequestToOwner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const brokerId = req.user?.userId;
    if (!brokerId) {
      throw new AuthError("Unauthorized");
    }

    const parsedData = SendBrokerRequestSchema.safeParse(req.body);

    if (!parsedData.success) {
      throw new ValidationError("Invalid broker request data");
    }

    const { ownerId } = req.body;

    const assignment = await sendBrokerRequestToOwnerService(brokerId, ownerId);

    res.status(201).json({
      success: true,
      message: "Request sent to owner successfully",
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

/* -------------------------------------------------------------------------- */
/* UPDATE BROKER REQUEST */
/* -------------------------------------------------------------------------- */
export const editBrokerRequestToUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user?.userId;

    if (!ownerId) {
      throw new AuthError("Unauthorized");
    }

    const parsedData = EditBrokerRequestSchema.safeParse(req.body);

    if (!parsedData.success) {
      throw new ValidationError("Invalid broker request data");
    }

    const { brokerId, id, status } = parsedData.data;

    const result = await updateBrokerRequestService({ id, brokerId, ownerId, status });

    res.status(200).json({
      success: true,
      message: result.message,
      brokerRequest: result.brokerRequest,
      conversation: result.conversation,
    });
  } catch (error) {
    next(error);
  }
};
