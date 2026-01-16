import { z } from "zod";

export const CreateShipSchema = z.object({
  shipName: z.string().min(1),
  slug: z.string().min(1),
  typeId: z.string().optional(),
  imo: z.coerce.number().int(),
  refitYear: z.coerce.number().int().optional(),
  buildYear: z.coerce.number().int().optional(),
  price: z.coerce.number(),
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
  mainImage: z.string().url(),
  images: z.array(z.string()).optional(),
  isPublished: z.coerce.boolean().optional().default(false),
});

export const EditShipSchema = CreateShipSchema.partial();

export type CreateShipInput = z.infer<typeof CreateShipSchema>;
export type EditShipInput = z.infer<typeof EditShipSchema>;
