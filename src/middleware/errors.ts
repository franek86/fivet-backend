import { Response, Request, NextFunction } from "express";
import { AppError } from "../helpers/error.helpers";
import { logger } from "../config/logger";

const errorMiddleware = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof AppError) {
    //console.log(`Error ${req.method} ${req.url} - ${err.message}`);
    logger.warn(
      {
        method: req.method,
        url: req.url,
        statusCode: err.statusCode,
      },
      err.message,
    );

    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      ...(err.details && { details: err.details }),
    });

    return;
  }

  logger.error(
    {
      method: req.method,
      url: req.url,
      err,
    },
    "Unhandled error",
  );
  res.status(500).json({ status: "error", error: "Something went wrong, please try again" });
  return;
};

export default errorMiddleware;
