import { z } from "zod";

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const RequestEmailChangeSchema = z.object({
  newEmail: z.string().email(),
  password: z.string().min(1),
});

// uskladi otp tip s VerifyOtpSchema
export const ConfirmEmailChangeSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(1),
});

export const FreezeAccountSchema = z.object({
  password: z.string().min(1),
});
