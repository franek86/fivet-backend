import jwt from "jsonwebtoken";

type TokenUserType = {
  id: string;
  role: string;
  fullName: string;
  subscription: string;
  isActiveSubscription: boolean;
};

type RefreshTokenPayload = {
  userId: string;
};

/**
 * Create short-lived access token
 * Expires in 5 minutes
 *  */
export const generateAccessToken = (user: TokenUserType): string => {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      fullName: user.fullName,
      subscription: user.subscription,
      isActiveSubscription: user.isActiveSubscription,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "5m" },
  );
};

/**
 * Create refresh token
 * Expires in 7 days or 30 days
 *  */
export const generateRefreshToken = (userId: string, expiresIn: "7d" | "30d" = "7d"): string => {
  return jwt.sign({ userId }, process.env.REFRESH_SECRET as string, {
    expiresIn: expiresIn,
  });
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, process.env.REFRESH_SECRET as string) as RefreshTokenPayload;
};

/**
 * Creates a short-lived token used only after a successfull
 * password-reset OTP verification
 */
export const generatePasswordResetToken = (userId: string): string => {
  return jwt.sign({ userId, purpose: "password-reset" }, process.env.JWT_SECRET as string, { expiresIn: "10m" });
};

/**
 * Verify token for password reset OTP
 */
export const verifyPasswordResetToken = (token: string): { userId: string; purpose: string } => {
  return jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string; purpose: string };
};
