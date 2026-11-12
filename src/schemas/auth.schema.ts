import { z } from "zod";
import { UserSchema } from "./user.schema";

const emailSchema = z.string().trim().toLowerCase().email("Invalid email format").min(5).max(255);

export const RegisterUserSchema = UserSchema.pick({
  email: true,
  fullName: true,
  role: true,
  address: true,
  zipCode: true,
  city: true,
  country: true,
  companyName: true,
  companyRegistrationNumber: true,
}).extend({
  role: z.enum(["BROKER", "OWNER", "BUYER"]),
});

export const VerifyUserSchema = RegisterUserSchema.extend({
  otp: z.string().length(6),
  password: z.string().min(8),
});

export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
});

export const ForgotPasswordSchema = z.object({
  email: emailSchema,
});

export const VerifyOtpSchema = z.object({
  email: emailSchema,
  otp: z.string().length(6),
});

export const ResetPasswordSchema = z.object({
  resetToken: z.string().min(6),
  newPassword: z.string().min(8),
});

export type RegisterUserSchema = z.infer<typeof RegisterUserSchema>;
