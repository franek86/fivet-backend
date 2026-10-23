/**
 * Generate a numeric OTP (One-Time Password) of a given length
 * @param length - number of digits in the OTP (default is 6)
 * @returns OTP as a string, padded with leading zeros if necessary
 */

import { randomInt } from "crypto";

export const generateOtp = (length = 6): string => {
  return randomInt(0, 10 ** length)
    .toString()
    .padStart(length, "0");
};
