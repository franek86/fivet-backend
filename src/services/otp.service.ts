import prisma from "../prismaClient";
import { generateOtp } from "../helpers/generateOtp.helpers";
import { ValidationError } from "../helpers/error.helpers";

const OTP_EXPIRATION_MS = 60 * 1000;

/**
 * Creates a new OTP for an email address
 * Exisiting OTP are removed first so that only the latest
 * vrification code remains valid
 */
export const createOTP = async (email: string): Promise<string> => {
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
const MAX_ATTEMPTS = 5;
export const verifyOtp = async (email: string, otp: string): Promise<void> => {
  const record = await prisma.otp.findUnique({ where: { email } });
  if (!record) {
    throw new ValidationError("OTP not found. Request a new one.");
  }
  if (record.expiresAt < new Date()) {
    await prisma.otp.delete({ where: { email } });
    throw new ValidationError("OTP expired. Request a new one.");
  }
  if (record.otp !== otp) {
    if (record.attempts + 1 >= MAX_ATTEMPTS) {
      await prisma.otp.delete({ where: { email } });
      throw new ValidationError("Too many attempts. Request a new code.");
    }
    await prisma.otp.update({ where: { email }, data: { attempts: { increment: 1 } } });
    throw new ValidationError("Invalid OTP");
  }
  await prisma.otp.delete({ where: { email } });
};
