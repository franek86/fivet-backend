import { NextFunction } from "express";
import redis from "../../redis/index";
import { sendEmail } from "../utils/sendMail";
import { ValidationError } from "./errorHandler";

// Utility function to generate 6-digit OTP
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export const checkOtpRestrictions = async (email: string, next: NextFunction) => {
  if (await redis.get(`otp_lock:${email}`)) {
    return next(new ValidationError("Account locked due multiple failed attempts! Try again after 30 minutes."));
  }
  if (await redis.get(`otp_spam_lock:${email}`)) {
    return next(new ValidationError("Too many OTP requests! Please wait 1 hour before requesting again."));
  }

  if (await redis.get(`otp_cooldown:${email}`)) {
    return next(new ValidationError("Please wait 1 minute before requesting a new OTP."));
  }
};

export const trackOtpRequest = async (email: string, next: NextFunction) => {
  const otpRequestKey = `otp_request_count:${email}`;
  let otpRequests = parseInt((await redis.get(otpRequestKey)) || "0");
  if (otpRequests >= 2) {
    await redis.set(`otp_spam_lock:${email}`, "locked", "EX", 3600); // locak for 1 hour
    throw new ValidationError("Too many OTP requests. Please wait 1 hour before requesting again");
  }

  await redis.set(otpRequestKey, otpRequests + 1, "EX", 3600);
};

export const sendOtp = async (name: string, email: string, template: string) => {
  const otp = generateOTP();
  await sendEmail(email, "Verify your email", template, { name, otp });
  await redis.set(`otp:${email}`, otp, "EX", 300);
  await redis.set(`otp_cooldown:${email}`, "true", "EX", 60);
};

export const verifyOtp = async (email: string, otp: string, next: NextFunction) => {
  const storedOtp = await redis.get(`otp:${email}`);
  if (!storedOtp) throw new ValidationError("Invalid or expired OTP!");

  const failedAttemptsKey = `otp_attempts:${email}`;
  const failedAttempts = parseInt((await redis.get(failedAttemptsKey)) || "0");

  if (storedOtp !== otp) {
    if (failedAttempts >= 2) {
      await redis.set(`otp_lock:${email}`, "locked", "EX", 1800); //Locked for 30 minutes
      await redis.del(`otp:${email}`, failedAttemptsKey);
      throw new ValidationError("Too many failed attempts. You account is locked for 30 minutes.");
    }
    await redis.set(failedAttemptsKey, failedAttempts + 1, "EX", 300);
    throw new ValidationError(`Inccorect OTP. ${2 - failedAttempts} attemps left.`);
  }

  await redis.del(`otp:${email}`, failedAttemptsKey);
};
