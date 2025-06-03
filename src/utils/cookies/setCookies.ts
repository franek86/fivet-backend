import { Response } from "express";

export const setCookie = (res: Response, name: string, value: string) => {
  res.cookie(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", // TO DO: in production sameSite must be true
    maxAge: 5 * 60 * 1000, // TO DO: set to 7 days
  });
};
