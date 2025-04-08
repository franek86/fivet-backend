import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../cloudinaryConfig";

const storage = new CloudinaryStorage({
  cloudinary,
});

const upload = multer({ storage });
export default upload;
