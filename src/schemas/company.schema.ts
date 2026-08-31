import z from "zod";

export const EditCompanySchema = z.object({
  name: z.string().optional(),
  vat: z.string().optional(),
  legalName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  website: z.string().optional(),
});

export type EditCompanySchema = z.infer<typeof EditCompanySchema>;
