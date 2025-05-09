import { z } from "zod";
const StatusEnum = z.enum(["REGULAR", "IMPORTANT"]);
export const addressBookSchema = z.object({
  fullName: z.string(),
  email: z.string().email(),
  phone_number: z.string(),
  mobile_number: z.string(),
  country: z.string(),
  address_2: z.string(),
  web_link: z.string().url().optional(),
  linkedin_link: z.string().url().optional(),
  facebook_link: z.string().url().optional(),
  instagram_link: z.string().url().optional(),
  tiktok_link: z.string().url().optional(),
  priority: StatusEnum.default("REGULAR"),
  company: z.string(),
  address: z.string(),
  userId: z.string().uuid(),
});
