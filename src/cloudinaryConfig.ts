import { v2 as cloudinary } from "cloudinary";

/* Types */
import type { UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
  timeout: 60000,
});

/**
 * Uploads a single file to Cloudinary and removes local file
 */
export const uploadSingleFile = (buffer: Buffer, folder: string) =>
  new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) return reject(error);
      if (!result) return reject(new Error("Upload failed"));

      resolve({ url: result.secure_url, publicId: result.public_id });
    });

    stream.end(buffer);
  });

/**
 * Uploads multiple files to Cloudinary and removes local files
 */
export const uploadMultipleFiles = async (files: Express.Multer.File[], folder: string): Promise<{ url: string; publicId: string }[]> => {
  /* const urls: { url: string; publicId: string }[] = [];

  for (const file of files) {
    const result = await cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) throw error;
      return result;
    });

    // Use a promise wrapper for upload_stream
    const uploaded = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder }, (err, res) => {
        if (err) reject(err);
        else resolve(res!);
      });
      stream.end(file.buffer);
    });

    urls.push({ url: uploaded.secure_url, publicId: uploaded.public_id });
  }

  return urls; */
  const uploadFile = (file: Express.Multer.File) =>
    new Promise<{ url: string; publicId: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder }, (err, res) => {
        if (err) return reject(err);
        resolve({ url: res!.secure_url, publicId: res!.public_id });
      });
      stream.end(file.buffer);
    });

  // Upload all files in parallel
  const uploadedFiles = await Promise.all(files.map(uploadFile));

  return uploadedFiles;
};

/* Upload blog image */
export const uploadSingleFileToCloudinary = (buffer: Buffer, folder: string, publicId?: string): Promise<UploadApiResponse | undefined> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          allowed_formats: ["png", "jpg", "webp"],
          resource_type: "image",
          folder: folder,
          public_id: publicId,
          transformation: { quality: "auto" },
        },
        (err, result) => {
          if (err) {
            console.log("Error uploading image to Cloundinary");
            reject(err);
          }

          resolve(result);
        },
      )
      .end(buffer);
  });
};

export default cloudinary;
