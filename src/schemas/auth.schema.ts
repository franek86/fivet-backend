import { z } from "zod";
import { SubscriptionEnum, UserSchema } from "./user.schema";

export const RegisterUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(100),
});

export const VerifyUserSchema = UserSchema.extend({
  otp: z.string().length(6),
  subscription: SubscriptionEnum,
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
