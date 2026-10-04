import cloudinary from "../config/cloudinary";
import type { UploadApiResponse } from "cloudinary";

//Uploads a single file to Cloudinary and removes local file
export const uploadSingleFile = (buffer: Buffer, folder: string) =>
  new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) return reject(error);
      if (!result) return reject(new Error("Upload failed"));

      resolve({ url: result.secure_url, publicId: result.public_id });
    });

    stream.end(buffer);
  });

//Uploads multiple files to Cloudinary and removes local files
// Upload all files in parallel
export const uploadMultipleFiles = async (files: Express.Multer.File[], folder: string): Promise<{ url: string; publicId: string }[]> => {
  const uploadFile = (file: Express.Multer.File) =>
    new Promise<{ url: string; publicId: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder }, (err, res) => {
        if (err) return reject(err);
        resolve({ url: res!.secure_url, publicId: res!.public_id });
      });
      stream.end(file.buffer);
    });

  const uploadedFiles = await Promise.all(files.map(uploadFile));

  return uploadedFiles;
};

// Upload blog image
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
