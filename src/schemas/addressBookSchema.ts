import { z } from "zod";
const StatusEnum = z.enum(["REGULAR", "IMPORTANT"]);
export const addressBookSchema = z.object({
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
  userId: z.string().uuid(),
});
