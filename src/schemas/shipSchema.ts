import { z } from "zod";

const parseOptionalNumber = (val: unknown) => {
  if (val == null) return null;
  if (Array.isArray(val)) val = val[0];
  if (val === "") return null;

  const num = Number(val);
  return isNaN(num) ? null : num;
};

const currentYear = new Date().getFullYear();

export const shipSchema = z.object({
  shipName: z.string().min(1, "Ship name is required"),
  imo: z.string().min(1, "Ship IMO is required"),
  refitYear: z.preprocess(parseOptionalNumber, z.number().int().positive().nullable().optional()),
  buildYear: z.preprocess(parseOptionalNumber, z.number().int().positive().max(currentYear).nullable().optional()),
  isPublished: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => (typeof val === "string" ? val === "true" : Boolean(val))),

  price: z.coerce.number({ required_error: "Price is required", invalid_type_error: "Price must be a number" }).positive(),
  location: z.string().min(1, "Ship location is required"),
  mainEngine: z.string().min(1, "Main engine is required"),
  lengthOverall: z.string().min(1, "Leght overall is required"),
  beam: z.coerce.number({ required_error: "Beam is required", invalid_type_error: "Beam must be a number" }).positive(),
  length: z.coerce.number({ required_error: "Length is required", invalid_type_error: "Length must be a number" }).positive(),
  depth: z.coerce.number({ required_error: "Depth is required", invalid_type_error: "Depth must be a number" }).positive(),
  draft: z.coerce.number({ required_error: "Draft is required", invalid_type_error: "Draft must be a number" }).positive(),
  tonnage: z.coerce.number({ required_error: "Tonnage is required", invalid_type_error: "Tonnage must be a number" }).positive(),
  cargoCapacity: z.string().min(1, "Cargo capacity is required"),
  buildCountry: z.string().optional(),
  remarks: z.string().optional(),
  description: z.string().optional(),
  userId: z.string().uuid("User ID must be valid"),
  typeId: z.string().uuid("Ship type are required"),
});
