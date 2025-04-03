import { Request } from "express";
import { Prisma } from "@prisma/client";

/* SHIP */
export type DeleteShipRequest = Request<{ id: string }, unknown, unknown>;

/* SHIPTYPE */
// Define type for the request body of creating a ship type
export type CreateShipTypeRequest = Request<unknown, unknown, Prisma.ShipTypeCreateInput>;

//Define type for update ship type
export type UpdateShipTypeRequest = Request<{ id: string }, unknown, Prisma.ShipTypeUpdateInput>;

// Define type for delete ship type
export type DeleteShipTypeRequest = Request<{ id: string }, unknown, unknown>;
