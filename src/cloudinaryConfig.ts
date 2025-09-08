import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

/**
 * Uploads a single file to Cloudinary and removes local file
 */
export const uploadSingleFile = async (filePath: string, folder: string): Promise<string> => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
  });
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return result.secure_url;
};

/**
 * Uploads multiple files to Cloudinary and removes local files
 */
export const uploadMultipleFiles = async (files: Express.Multer.File[], folder: string): Promise<string[]> => {
  const urls: string[] = [];

  for (const file of files) {
    const result = await cloudinary.uploader.upload(file.path, { folder });
    urls.push(result.secure_url);
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }

  return urls;
};

export default cloudinary;
