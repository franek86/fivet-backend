import { Request, Response } from "express";
import prisma from "../prismaClient";
import { logger } from "../config/logger";
import { ValidationError } from "../helpers/error.helpers";
import { EditCompanySchema } from "../schemas/company.schema";

/* get company profile */
export const getCompanyProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    logger.warn("User id missing");
    throw new ValidationError("Unauthorize");
  }

  const data = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      company: true,
    },
  });

  res.status(200).json(data);

  try {
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* edit company profile */
export const editCompnyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.user?.userId;

    const existingCompanyProfile = await prisma.user.findUnique({
      where: { id },
      include: {
        company: true,
      },
    });

    if (!existingCompanyProfile?.company) {
      logger.warn("Company not found");
      throw new ValidationError("Not found");
    }

    const parsedData = EditCompanySchema.safeParse(req.body);
    if (!parsedData.success) {
      res.status(400).json({ errors: parsedData.error.errors });
      return;
    }
    console.log("RAW DATA ====================== ", req.body);
    console.log("PARSED DATA =================== ", parsedData.data);

    await prisma.company.update({
      where: { id: existingCompanyProfile.company.id },
      data: req.body.data,
    });

    res.status(200).json({ message: "Compoany profile updated", status: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
