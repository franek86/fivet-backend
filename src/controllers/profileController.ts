import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { CustomJwtPayload } from "../middleware/verifyToken";
import cloudinary from "../cloudinaryConfig";
import fs from "fs";

const prisma = new PrismaClient();

/* GET ALL USER PROFILE
ONLY ADMIN CAN SEE ALL USER 
*/
export const getAllProfiles = async (req: Request, res: Response): Promise<any> => {
  try {
    const data = await prisma.profile.findMany({ include: { user: { select: { email: true } } } });
    const result = data.map((p) => ({
      id: p.id,
      fullName: p.fullName,
      avatar: p.avatar,
      userId: p.userId,
      email: p.user.email,
    }));
    return res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

/* GET SINGLE USER PROFILE BY ID */
export const getUserProfile = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { userId } = req.user as CustomJwtPayload;

  if (!id) return res.status(400).json({ message: "User ID is required" });
  if (!userId) return res.status(401).json({ message: "User ID can not found" });

  const parsedId = parseInt(id);

  try {
    const data = await prisma.profile.findUnique({ where: { id: parsedId } });

    if (!data) {
      return res.status(404).json({ message: "Profile not found" });
    }

    return res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

/* CREATE PROFILE  */
export const createProfile = async (req: Request, res: Response): Promise<any> => {
  const { userId, fullName } = req.body;
  const avatar = req.file?.path;

  try {
    const profileData = await prisma.profile.create({
      data: {
        userId,
        fullName,
        avatar,
      },
    });

    res.status(200).json({ message: "Succefully created profile", data: profileData });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* UPDATE PROFILE */
export const updateProfile = async (req: Request, res: Response): Promise<any> => {
  const { fullName, email } = req.body;
  const userId = req.body.userId || req.user?.userId;

  try {
    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!existingProfile) return res.status(404).json({ message: "Profile not found" });

    let avatarUrl = existingProfile.avatar;
    if (req.file) {
      const upload = await cloudinary.uploader.upload(req.file.path, {
        folder: "avatars",
        transformation: [{ width: 150, height: 150, crop: "fill" }],
      });
      avatarUrl = upload.secure_url;
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
    console.log(avatarUrl);

    const [updateProfile, updateUser] = await prisma.$transaction([
      prisma.profile.update({
        where: { userId },
        data: {
          fullName: fullName ?? existingProfile.fullName,
          avatar: avatarUrl,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          email: email ?? existingProfile.user.email,
        },
      }),
    ]);

    return res.status(200).json({ message: "Profile updated", profile: { ...updateProfile, email: updateUser.email } });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
