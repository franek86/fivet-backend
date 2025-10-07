import { Response, Request, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { CustomJwtPayload } from "../middleware/verifyToken";
import { addressBookSchema } from "../schemas/addressBook.schema";
import prisma from "../prismaClient";
import { ValidationError } from "../helpers/errorHandler";

/*  GET ALL ADDRESS BOOK BASED ON USER ID*/
export const getAddressBook = async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as CustomJwtPayload;
  const { search } = req.query;

  if (!userId) throw new ValidationError("User ID can not found");
  const whereCondition: any = {};

  if (userId) whereCondition.userId = userId;

  if (search && typeof search === "string" && search.trim().length > 0) {
    whereCondition.OR = [
      {
        fullName: {
          contains: search.trim(),
          mode: "insensitive",
        },
      },
      {
        email: { contains: search.trim(), mode: "insensitive" },
      },
    ];
  }

  try {
    const data = await prisma.addressBook.findMany({ where: whereCondition, orderBy: { createdAt: "desc" } });
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* GET SINGLE ADDRESS BOOK */
export const getSingleAddressBook = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { id } = req.params;
  if (!id) throw new ValidationError("ID not found");
  try {
    const singleData = await prisma.addressBook.findUnique({ where: { id } });
    if (!singleData) throw new ValidationError("Address book by id not found");

    return res.status(200).json(singleData);
  } catch (error) {
    next(error);
  }
};

/* CREATE ADDRESS BOOK ONLY USER */
export const createAddressBook = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { userId } = req.user as CustomJwtPayload;

  const body = addressBookSchema.parse(req.body);
  try {
    const addressBookData: Prisma.AddressBookUncheckedCreateInput = {
      ...body,
      userId,
    };
    const createAddressBookData = await prisma.addressBook.create({ data: addressBookData });
    return res.status(200).json(createAddressBookData);
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

/* UPDATE ADDRESS BOOK */
export const updateAddressBook = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { id } = req.params;
  if (!id) throw new ValidationError("ID does not exists.");

  const { ...updateData } = req.body;

  try {
    const uniqueAddressBook = await prisma.addressBook.findUnique({ where: { id } });
    if (!uniqueAddressBook) throw new ValidationError("Address book not found");

    await prisma.addressBook.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: "Address book successfully updated.",
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

/* DELETE ADDRESS BOOK ONLY USER */
export const deleteAddressBook = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { id } = req.params;
  if (!id) throw new ValidationError("ID does not exists.");
  try {
    const uniqueAddressBook = await prisma.addressBook.findUnique({ where: { id } });
    if (!uniqueAddressBook) throw new ValidationError("Address book not found.");

    await prisma.addressBook.delete({
      where: { id },
    });

    return res.status(200).json({
      message: `Address book by ${id} deleted successfully`,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};
