import { Request, Response } from "express";

import { createCheckoutSession } from "../services/stripe.service";

import { AuthError } from "../helpers/error.helpers";
import { createCheckoutSchema } from "../schemas/stripe.schema";

/* Create stripe checkout */
export const createStripeCheckout = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      throw new AuthError("Unauthorized.");
    }

    const data = createCheckoutSchema.parse(req.body);
    const session = await createCheckoutSession(req.user?.userId, data);

    return res.status(200).json(session);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: "Unable to create checkout session" });
  }
};
