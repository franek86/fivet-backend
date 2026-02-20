import { Response } from "express";

export const setCookie = (res: Response, name: string, value: string, maxAge: number) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie(name, value, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "strict", // TO DO: in production sameSite must be true
    maxAge,
  });
};
