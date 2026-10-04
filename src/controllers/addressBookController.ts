import type { Response, Request } from "express";
import { Prisma } from "@prisma/client";
import geoip from "geoip-lite";

import prisma from "../prismaClient";
import { AddressBookFilterSchema, AddressBookSchema, UpdateAddressBookSchema } from "../schemas/addressBook.schema";
import { countries } from "../utils/countries";
import { buildPageMeta } from "../utils/pagination";

/* -------------------------------------------------------------------------- */
/* Types */
/* -------------------------------------------------------------------------- */
type AddressBookParams = { id: string };

/* -------------------------------------------------------------------------- */
/* GET ADDRESS BOOK */
/* -------------------------------------------------------------------------- */
/**
 * Supports:
 * Search by full name, email and address.
 * Pagination
 * Sort by create date
 * */
export const getAddressBook = async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const parsedFilters = AddressBookFilterSchema.safeParse(req.query);

  if (!parsedFilters.success) {
    res.status(400).json({
      message: "Invalid filters",
      errors: parsedFilters.error.flatten(),
    });

    return;
  }

  const filters = parsedFilters.data;

  const skip = (filters.page - 1) * filters.limit;

  const where: Prisma.AddressBookWhereInput = { userId };

  const search = filters.search?.trim();

  if (search) {
    where.OR = [
      {
        fullName: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        email: { contains: search, mode: "insensitive" },
      },
      {
        address: { contains: search, mode: "insensitive" },
      },
    ];
  }

  try {
    const [address, total] = await Promise.all([
      prisma.addressBook.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: {
          [filters.sortBy]: filters.order,
        },
      }),
      prisma.addressBook.count({ where }),
    ]);

    const meta = buildPageMeta(total, filters.page, filters.limit);

    res.status(200).json({
      address,
      meta,
    });
  } catch (error) {
    console.error("Failed to fetch address book:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* -------------------------------------------------------------------------- */
/* GET SINGLE ADDRESS BOOK */
/* -------------------------------------------------------------------------- */

/**
 *  Returns single address book belonging to the authenticated user
 * */
export const getSingleAddressBook = async (req: Request<AddressBookParams>, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    res.status(401).json({
      message: "Unauthorize",
    });
    return;
  }

  if (!id) {
    res.status(400).json({
      message: "Address book ID are required",
    });
    return;
  }
  try {
    const address = await prisma.addressBook.findFirst({ where: { id, userId } });
    if (!address) {
      res.status(404).json({ message: "Address book not found" });
      return;
    }

    res.status(200).json(address);
  } catch (error) {
    console.error("Failed to fetch address book entry:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* -------------------------------------------------------------------------- */
/* CREATE ADDRESS BOOK */
/* -------------------------------------------------------------------------- */

/**
 * Create address book entry for the authenicated user
 */
export const createAddressBook = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({
      message: "Unauthorized",
    });
    return;
  }

  const parsedData = AddressBookSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ message: "Invalid address data", errors: parsedData.error.flatten() });
    return;
  }
  try {
    const address = await prisma.addressBook.create({
      data: {
        ...parsedData.data,
        userId,
      },
    });
    res.status(201).json(address);
  } catch (error) {
    console.error("Failed to create address book entry:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* -------------------------------------------------------------------------- */
/* UPDATE ADDRESS BOOK */
/* -------------------------------------------------------------------------- */

/**
 * Updates an address belonging to the authenticated user.
 */
export const updateAddressBook = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (!id) {
    res.status(400).json({
      message: "Address book ID are required",
    });
    return;
  }

  const parsedData = UpdateAddressBookSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ message: "Invalid address data", errors: parsedData.error.flatten() });
    return;
  }

  try {
    const address = await prisma.addressBook.findFirst({ where: { id, userId } });

    if (!address) {
      res.status(404).json({
        message: "Address book not found",
      });
      return;
    }

    const updatedAddress = await prisma.addressBook.update({
      where: { id },
      data: parsedData.data,
    });

    res.status(200).json({
      message: "Address book successfully updated.",
      address: updatedAddress,
    });
  } catch (error) {
    console.error("Failed to update address book entry:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* -------------------------------------------------------------------------- */
/* DELETE ADDRESS BOOOK */
/* -------------------------------------------------------------------------- */

/**
 *  Delete address book belonging to the authenticated suer
 */
export const deleteAddressBook = async (req: Request<AddressBookParams>, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (!id) {
    res.status(400).json({ message: "Address book ID are required" });
    return;
  }

  try {
    const address = await prisma.addressBook.findFirst({ where: { id, userId } });
    if (!address) {
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
    console.error("Failed to delete address book entry:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* -------------------------------------------------------------------------- */
/* GEO COUNTRY PHONE CODE */
/* -------------------------------------------------------------------------- */

/**
 * Detects the user's country from they IP address
 * and returs corresponding contry information
 * */

export const getCountryPhoneCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.ip || req.socket.remoteAddress || "";
    console.log("IP: ", ip);
    const geo = geoip.lookup(ip);
    const countryCode = geo?.country || "US";

    const country = countries.find((c) => c.code === countryCode);

    if (!country) {
      res.status(404).json({ message: "Country information not found" });
      return;
    }

    res.status(200).json(country);
  } catch (error) {
    console.error("Failed to detect country:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
