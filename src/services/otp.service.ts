import prisma from "../prismaClient";
import { generateOtp } from "../helpers/generateOtp.helpers";

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
export const verifyOtp = async (email: string, otp: string): Promise<void> => {
  const record = await prisma.otp.findUnique({ where: { email } });
  if (!record) {
    throw new Error("OTP not found. Request a new one.");
  }
  if (record.expiresAt < new Date()) {
    await prisma.otp.delete({ where: { email } });
    throw new Error("OTP expired. Request a new one.");
  }
  if (record.otp !== otp) {
    throw new Error("Invalid OTP");
  }
  await prisma.otp.delete({ where: { email } });
};
