import { Request, Response, NextFunction } from "express";
import { uploadSingleFileToCloudinary } from "../cloudinaryConfig";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export const profileImageUpload = (method: "post" | "put") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (method === "put" && !req.file) {
      next();
      return;
    }

    if (!req.file) {
      return res.status(400).json({
        message: "File is required",
      });
    }

    if (req.file?.size > MAX_FILE_SIZE) {
      res.status(413).json({
        message: "File size must be less than 2MB",
      });
      return;
    }

    try {
      const data = await uploadSingleFileToCloudinary(req.file?.buffer, "avatars");

      //const publicId = data?.public_id.replace("avatars/", "");
      if (!data) {
        res.status(500).json({ message: "Internal server error" });
      }

      req.body.avatar = data?.secure_url;
      //req.body.profilePublicId = publicId;

      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error while uploading single image to cloudinary" });
    }
  };
};
