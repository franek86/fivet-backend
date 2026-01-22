"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultipleFiles = exports.uploadSingleFile = void 0;
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
});
/**
 * Uploads a single file to Cloudinary and removes local file
 */
const uploadSingleFile = (buffer, folder) => new Promise((resolve, reject) => {
    const stream = cloudinary_1.v2.uploader.upload_stream({ folder }, (error, result) => {
        if (error)
            return reject(error);
        if (!result)
            return reject(new Error("Upload failed"));
        resolve({ url: result.secure_url, publicId: result.public_id });
    });
    stream.end(buffer);
});
exports.uploadSingleFile = uploadSingleFile;
/* export const uploadSingleFile = async (filePath: string, folder: string): Promise<{ url: string; publicId: string }> => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
  });
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return { url: result.secure_url, publicId: result.public_id };
};
 */
/**
 * Uploads multiple files to Cloudinary and removes local files
 */
const uploadMultipleFiles = (files, folder) => __awaiter(void 0, void 0, void 0, function* () {
    const urls = [];
    for (const file of files) {
        const result = yield cloudinary_1.v2.uploader.upload(file.path, { folder });
        urls.push({ url: result.secure_url, publicId: result.public_id });
        if (fs_1.default.existsSync(file.path)) {
            fs_1.default.unlinkSync(file.path);
        }
    }
    return urls;
});
exports.uploadMultipleFiles = uploadMultipleFiles;
exports.default = cloudinary_1.v2;
