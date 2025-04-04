import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { CustomJwtPayload } from "../middleware/verifyToken";

const prisma = new PrismaClient();

/* GET ALL USER PROFILE
ONLY ADMIN CAN SEE ALL USER 
*/
export const getAllProfiles = async (req: Request, res: Response): Promise<any> => {
  try {
    const data = await prisma.profile.findMany();
    return res.status(200).json({ message: "Successfully get profiles", data });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

/* GET USER PROFILE BY USER ID */
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
