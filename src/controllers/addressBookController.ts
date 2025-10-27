import { Response, Request } from "express";
import { Prisma } from "@prisma/client";
import { AddressBookSchema, CreateAddressBookInput, UpdateAddressBookInput, UpdateAddressBookSchema } from "../schemas/addressBook.schema";
import prisma from "../prismaClient";

/*  GET ALL ADDRESS BOOK BASED ON USER ID*/
export const getAddressBook = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { search } = req.query;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  const whereCondition: Prisma.AddressBookWhereInput = {};

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
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/* GET SINGLE ADDRESS BOOK */
export const getSingleAddressBook = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id) {
    res.status(401).json({ message: "Address book ID are required" });
    return;
  }
  try {
    const singleData = await prisma.addressBook.findUnique({ where: { id } });
    if (!singleData) {
      res.status(404).json({ message: "Address book ID not found" });
      return;
    }

    res.status(200).json(singleData);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/* CREATE ADDRESS BOOK ONLY USER */
export const createAddressBook = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const body: CreateAddressBookInput = AddressBookSchema.parse(req.body);
  try {
    const addressBookData = {
      ...body,
      userId,
    };
    const createAddressBookData = await prisma.addressBook.create({ data: addressBookData });
    res.status(201).json(createAddressBookData);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/* UPDATE ADDRESS BOOK */
export const updateAddressBook = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id) {
    res.status(401).json({ message: "Address book ID are required" });
    return;
  }

  const parsedData = UpdateAddressBookSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ errors: parsedData.error.errors });
    return;
  }

  const updateData: UpdateAddressBookInput = parsedData.data;
  //const { ...updateData } = req.body;

  try {
    const uniqueAddressBook = await prisma.addressBook.findUnique({ where: { id } });
    if (!uniqueAddressBook) {
      res.status(404).json({ message: "Address book not found" });
      return;
    }

    await prisma.addressBook.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: "Address book successfully updated.",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/* DELETE ADDRESS BOOK ONLY USER */
export const deleteAddressBook = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id) {
    res.status(401).json({ message: "Address book ID are required" });
    return;
  }
  try {
    const uniqueAddressBook = await prisma.addressBook.findUnique({ where: { id } });
    if (!uniqueAddressBook) {
      res.status(404).json({ message: "Address book not found" });
      return;
    }

    await prisma.addressBook.delete({
      where: { id },
    });

    res.status(200).json({
      message: `Address book by ${id} deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
