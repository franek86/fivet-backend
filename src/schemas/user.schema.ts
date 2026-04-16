import { z } from "zod";

/**
 * Enums (match Prisma enums exactly)
 */
export const RoleEnum = z.enum(["USER", "ADMIN"]);
export const SubscriptionEnum = z.enum(["STARTER", "PREMIUM", "STANDARD"]);

/**
 * Base reusable fields
 */
const uuidSchema = z.string().uuid();

const emailSchema = z.string().email("Invalid email format").min(5).max(255).toLowerCase().trim();

const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(100);

const nameSchema = z.string().min(2, "Full name too short").max(100).trim();

const optionalString = z.string().min(1).max(255).trim().optional().nullable();

/**
 * Core User Schema (DB shape)
 */
export const UserSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  password: passwordSchema,
  fullName: nameSchema,
  role: RoleEnum.default("USER"),

  subscription: SubscriptionEnum.default("STARTER"),
  isActiveSubscription: z.boolean().default(false),
  verifyPayment: z.boolean().default(false),

  stripeCustomerId: z.string().optional().nullable(),
  stripeSubscriptionId: z.string().optional().nullable(),

  isActive: z.boolean().default(false),
  lastLogin: z.date().optional().nullable(),

  address: optionalString,
  zipCode: optionalString,
  city: optionalString,
  country: optionalString,

  createdAt: z.date(),
  updatedAt: z.date(),
});

export const PublicUserSchema = UserSchema.omit({
  password: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
});

export const UserMeResponseSchema = z.object({
  id: z.string(),
  role: z.string(),
  subscription: z.string(),
  isActive: z.boolean(),
  verifyPayment: z.boolean(),
  isActiveSubscription: z.boolean(),
  profile: z
    .object({
      id: z.coerce.number().int(),
      avatar: z.string().nullable().optional(),
      fullName: z.string(),
      userId: z.string(),
      email: z.string().email(),
    })
    .nullable(),
});

export type UserSchema = z.infer<typeof UserSchema>;
