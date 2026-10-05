import { Response, Request, NextFunction } from "express";
import { AppError } from "../helpers/error.helpers";
import { logger } from "../config/logger";

const errorMiddleware = (error: unknown, req: Request, res: Response, next: NextFunction): void => {
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logger.error(error);
    }
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    });

    return;
  }

  logger.error(error);

  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
};

export default errorMiddleware;
