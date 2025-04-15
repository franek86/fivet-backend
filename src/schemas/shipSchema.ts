import { z } from "zod";
const currentYear = new Date().getFullYear();
export const shipSchema = z.object({
  shipName: z.string().min(1, "Ship name is required"),
  imo: z.string().min(1, "Ship IMO is required"),
  refitYear: z.coerce
    .number()
    .int()
    .positive()
    .max(currentYear, { message: `Year must be ${currentYear} or earlier` })
    .optional(),
  buildYear: z.coerce
    .number()
    .int()
    .positive()
    .max(currentYear, { message: `Year must be ${currentYear} or earlier` })
    .optional(),
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
  buildCountry: z.string().min(1, "Build country is required"),
  remarks: z.string().optional(),
  description: z.string().optional(),
  userId: z.string().uuid(),
  typeId: z.string().uuid(),
});
