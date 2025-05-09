import { Response, Request } from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { CustomJwtPayload } from "../middleware/verifyToken";
import { addressBookSchema } from "../schemas/addressBookSchema";
const prisma = new PrismaClient();

/* 
    GET ALL ADDRESS BOOK BASED ON USER ID
*/
export const getAddressBook = async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.user as CustomJwtPayload;

  if (!userId) return res.status(401).json({ message: "User ID can not found" });
  try {
    const data = await prisma.addressBook.findMany({ where: { userId } });
    return res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

/* CREATE ADDRESS BOOK ONLY USER */
export const createAddressBook = async (req: Request, res: Response): Promise<any> => {
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
    res.status(500).json({ error: (error as Error).message });
  }
};
