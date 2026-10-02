import { Response, Request } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../prismaClient";
import geoip from "geoip-lite";
import z from "zod";

import { countries } from "../utils/countries";
import { AddressBookSchema, CreateAddressBookInput, UpdateAddressBookInput, UpdateAddressBookSchema } from "../schemas/addressBook.schema";
import { buildPageMeta } from "../utils/pagination";

const AddressBookFilterSchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(12),
  order: z.enum(["asc", "desc"]).default("desc"),
  sortBy: z.enum(["createdAt"]).default("createdAt"),
});

type AddressBookFilterType = z.infer<typeof AddressBookFilterSchema>;

/*  GET ALL ADDRESS BOOK BASED ON USER ID*/
export const getAddressBook = async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const result = AddressBookFilterSchema.safeParse(req.query);

  if (!result.success) {
    res.status(400).json({
      message: "Invalid filters",
      errors: result.error.flatten(),
    });

    return;
  }

  const filters = result.data as AddressBookFilterType;

  const whereCondition: Prisma.AddressBookWhereInput = {};
  const skip = (filters.page - 1) * filters.limit;

  if (userId) whereCondition.userId = userId;

  if (filters.search && typeof filters.search === "string" && filters.search.trim().length > 0) {
    whereCondition.OR = [
      {
        fullName: {
          contains: filters.search.trim(),
          mode: "insensitive",
        },
      },
      {
        email: { contains: filters.search.trim(), mode: "insensitive" },
      },
      {
        address: { contains: filters.search.trim(), mode: "insensitive" },
      },
    ];
  }

  try {
    const [address, total] = await Promise.all([
      prisma.addressBook.findMany({
        where: whereCondition,
        skip,
        take: filters.limit,
        orderBy: { [filters.sortBy]: filters.order },
      }),
      prisma.addressBook.count({ where: whereCondition }),
    ]);

    const meta = buildPageMeta(total, filters.page, filters.limit);

    res.status(200).json({ address, meta });
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

  const validateData: CreateAddressBookInput = AddressBookSchema.parse(req.body);
  try {
    const addressBookData = {
      ...validateData,
      userId: userId,
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

/* GET COUNTRY PHONE CODE BY IP */
export const getCountryPhoneCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.ip || req.socket.remoteAddress || "";
    console.log("IP: ", ip);
    const geo = geoip.lookup(ip);
    const countryCode = geo?.country || "US";

    const country = countries.find((c) => c.code === countryCode);

    res.status(200).json(country);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
