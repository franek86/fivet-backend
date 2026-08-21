import { z } from "zod";
import { SubscriptionEnum, UserSchema } from "./user.schema";

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
});

export const VerifyUserSchema = RegisterUserSchema.extend({
  otp: z.string().length(6),
  password: z.string().min(6),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  rememberMe: z.boolean().optional(),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const VerifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(6),
});

export type RegisterUserSchema = z.infer<typeof RegisterUserSchema>;
