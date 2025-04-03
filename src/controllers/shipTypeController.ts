/* 
ONLY ADMIN CAN CREATE, DELETE AND UPDATE SHIP TYPE
Verify Admin with authAdmin middleware in route
*/
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { CreateShipTypeRequest, DeleteShipTypeRequest, UpdateShipTypeRequest } from "../types";

const prisma = new PrismaClient();

/* CREATE SHIP TYPE BY ADMIN 
  Only admin can create ship type
*/

export const createShipType = async (req: CreateShipTypeRequest, res: Response): Promise<any> => {
  const { name, description } = req.body;

  try {
    const createNewData = await prisma.shipType.create({
      data: {
        name,
        description,
      },
    });

    return res.status(200).json({
      message: "Ship type added successfully!",
      data: createNewData,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* UPDATE SHIP TYPE BY ADMIN 
  Only admin can edit ship type
*/
export const updateShipType = async (req: UpdateShipTypeRequest, res: Response): Promise<any> => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ message: "Shipt type id could not found" });

  const { name, description } = req.body;

  try {
    const shipType = await prisma.shipType.findUnique({ where: { id } });
    if (!shipType) return res.status(404).json({ message: "Ship type is required" });

    const updateShipType = await prisma.shipType.update({
      where: { id },
      data: {
        name,
        description,
      },
    });

    return res.status(200).json({ message: "Ship type updated successfully", data: updateShipType });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* DELETE SHIP TYPE BY ID FOR ADMIN
  Only admin can delete ship type
*/

export const deleteShipType = async (req: DeleteShipTypeRequest, res: Response): Promise<any> => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "Ship type ID is required" });

  try {
    const findShipType = await prisma.shipType.findUnique({ where: { id } });
    if (!findShipType) return res.status(404).json({ message: "Ship type could not found" });

    await prisma.shipType.delete({ where: { id } });

    return res.status(200).json({ message: "Ship type deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* GET ALL SHIP TYPE
  Public route
*/
export const getShipType = async () => {};
