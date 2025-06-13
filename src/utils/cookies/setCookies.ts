import { Response } from "express";

export const setCookie = (res: Response, name: string, value: string, maxAge: number) => {
  res.cookie(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", // TO DO: in production sameSite must be true
    maxAge,
  });
};
