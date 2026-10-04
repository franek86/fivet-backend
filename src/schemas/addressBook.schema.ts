import { z } from "zod";

const StatusEnum = z.enum(["REGULAR", "IMPORTANT"]);

export const AddressBookSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email(),
  phone_number: z.string().optional().nullable(),
  mobile_number: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  address_2: z.string().optional().nullable(),
  web_link: z.string().optional().nullable(),
  linkedin_link: z.string().optional().nullable(),
  facebook_link: z.string().optional().nullable(),
  instagram_link: z.string().optional().nullable(),
  tiktok_link: z.string().optional().nullable(),
  priority: StatusEnum.default("REGULAR"),
  company: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

/**
 * Query params used for filtering and pagination
 */
export const AddressBookFilterSchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(12),
  order: z.enum(["asc", "desc"]).default("desc"),
  sortBy: z.enum(["createdAt"]).default("createdAt"),
});

export const UpdateAddressBookSchema = AddressBookSchema.partial();

export type AddressBookFilterType = z.infer<typeof AddressBookFilterSchema>;
export type CreateAddressBookInput = z.infer<typeof AddressBookSchema>;
export type UpdateAddressBookInput = z.infer<typeof UpdateAddressBookSchema>;
