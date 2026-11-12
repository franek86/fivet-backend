import { timingSafeEqual } from "crypto";
import prisma from "../prismaClient";
import { generateOtp } from "../helpers/generateOtp.helpers";
import { ValidationError } from "../helpers/error.helpers";

const OTP_EXPIRATION_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

/**
 * Creates a new OTP for an email address
 * Exisiting OTP are removed first so that only the latest
 * vrification code remains valid
 */
export const createOTP = async (email: string): Promise<string> => {
  const existing = await prisma.otp.findUnique({ where: { email } });
  if (existing && existing.expiresAt.getTime() - Date.now() > OTP_EXPIRATION_MS - RESEND_COOLDOWN_MS) {
    throw new ValidationError("Please wait a minute before requesting a new code.");
  }

  await prisma.otp.deleteMany({
    where: { email },
  });

  const otp = generateOtp(6);

  await prisma.otp.create({
    data: {
      email,
      otp,
      expiresAt: new Date(Date.now() + OTP_EXPIRATION_MS),
    },
  });

  return otp;
};

/**
 *
 * Validates an OTP and removes it after successful verification.
 * */

export const verifyOtp = async (email: string, otp: string): Promise<void> => {
  const record = await prisma.otp.update({ where: { email }, data: { attempts: { increment: 1 } } }).catch(() => null);

  if (!record) throw new ValidationError("OTP not found. Request a new one.");

  if (record.expiresAt < new Date()) {
    await prisma.otp.delete({ where: { email } });
    throw new ValidationError("OTP expired. Request a new one.");
  }
  if (record.attempts > MAX_ATTEMPTS) {
    await prisma.otp.deleteMany({ where: { email } });
    throw new ValidationError("Too many attempts. Request a new code.");
  }

  // 2) usporedba u konstantnom vremenu
  const a = Buffer.from(record.otp);
  const b = Buffer.from(otp);
  const valid = a.length === b.length && timingSafeEqual(a, b);

  if (!valid) {
    if (record.attempts >= MAX_ATTEMPTS) {
      await prisma.otp.deleteMany({ where: { email } });
      throw new ValidationError("Too many attempts. Request a new code.");
    }
    throw new ValidationError("Invalid OTP");
  }

  // 3) jednokratno: samo jedan paralelni zahtjev uspije obrisati
  const { count } = await prisma.otp.deleteMany({ where: { email, otp: record.otp } });
  if (count === 0) throw new ValidationError("OTP not found. Request a new one.");
};
