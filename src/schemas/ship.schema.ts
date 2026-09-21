import { z } from "zod";

const ImageSchema = z.object({
  alt: z.string().optional(),
  url: z.string().url(),
  publicId: z.string().optional(),
});

export const CreateShipSchema = z.object({
  shipName: z.string().min(1),
  slug: z.string().min(1),
  typeId: z.string().min(1),
  imo: z.coerce.number().int(),
  buildYear: z.coerce.number().int(),
  buildCountry: z.string().optional(),
  flag: z.string().optional(),

  price: z.coerce.number().nonnegative(),
  currency: z.string().optional(),

  mainEngine: z.string().optional(),
  enginePower: z.string().optional(),

  dwt: z.coerce.number().nonnegative(),
  lengthOverall: z.coerce.number(),
  netTonnage: z.coerce.number().nonnegative().optional(),
  grossTonnage: z.coerce.number().nonnegative().optional(),
  beam: z.coerce.number(),
  draft: z.coerce.number(),
  cargoCapacity: z.string().optional(),

  fuelType: z.string().optional(),
  cruisingSpeed: z.coerce.number().nonnegative().optional(),

  classNotation: z.string().optional(),
  ssDueDate: z.coerce.date().optional(),
  ddDueDate: z.coerce.date().optional(),
  currentPort: z.string().optional(),
  nextPort: z.string().optional(),

  description: z.string().optional(),
  images: z.array(ImageSchema).optional(),
  mainImage: z.string().url(),
  mainImageAlt: z.string().optional(),
  isPublished: z.coerce.boolean().optional().default(false),
});

export const EditShipSchema = z.object({
  shipName: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  typeId: z.string().optional(),
  imo: z.coerce.number().int().optional(),
  refitYear: z.coerce.number().int().optional(),
  buildYear: z.coerce.number().int().optional(),
  price: z.coerce.number().optional(),
  location: z.string().optional(),
  mainEngine: z.string().optional(),
  lengthOverall: z.coerce.number().optional(),
  beam: z.coerce.number().optional(),
  length: z.coerce.number().optional(),
  depth: z.coerce.number().optional(),
  draft: z.coerce.number().optional(),
  tonnage: z.coerce.number().optional(),
  cargoCapacity: z.string().optional(),
  buildCountry: z.string().optional(),
  remarks: z.string().optional(),
  description: z.string().optional(),
  isPublished: z.coerce.boolean().optional(),
  mainImageAlt: z.string().optional(),
  // Do NOT include mainImage or images here
});

export type CreateShipInput = z.infer<typeof CreateShipSchema>;
export type EditShipInput = z.infer<typeof EditShipSchema>;
