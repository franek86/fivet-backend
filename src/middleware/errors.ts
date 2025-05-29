import { Response, Request } from "express";
import { AppError } from "../helpers/errorHandler";

const errorMiddleware = (err: Error, req: Request, res: Response): any => {
  if (err instanceof AppError) {
    console.log(`Error ${req.method} ${req.url} - ${err.message}`);

    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  console.error("Unhandled error:", {
    message: err.message,
    stack: err.stack,
  });
  return res.status(500).json({ status: "error", error: "Something went wrong, please try again" });
};

export default errorMiddleware;
