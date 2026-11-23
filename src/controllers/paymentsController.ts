import { Request, Response } from "express";
import prisma from "../prismaClient";
import { stripe } from "../utils/stripe";
import { paymentFilters } from "../utils/paymentFilters";
import { buildPageMeta } from "../utils/pagination";
import { PaymentFilterSchema } from "../schemas/payment.schema";

/* Get all payments
 * Protected - admin only
 */
export const getPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = PaymentFilterSchema.safeParse(req.query);

    if (!result.success) {
      res.status(400).json({
        message: "Invalid filters",
        errors: result.error.flatten(),
      });

      return;
    }

    const filters = result.data;

    const { where } = paymentFilters(filters);
    const skip = (filters.page - 1) * filters.limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: { [filters.sortBy]: filters.order },

        include: {
          user: {
            select: {
              email: true,
            },
          },

          subscription: {
            select: {
              plan: true,
              status: true,
              currentPeriodStart: true,
              currentPeriodEnd: true,
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    const meta = buildPageMeta(total, filters.page, filters.limit);

    res.status(200).json({ meta, payments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* Get Single payment
 * Protected - Authorized
 */
export const getPaymentDetails = async (req: Request<{ sessionId: string }>, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    console.log("Session id ---- ", sessionId);
    console.log("Session ---- ", session);

    const subscription = session.subscription;

    if (!subscription || typeof subscription === "string") {
      return res.status(404).json({
        message: "Subscription not found",
      });
    }

    const price = subscription.items.data[0].price;

    const productId = typeof price.product === "string" ? price.product : price.product.id;

    const product = await stripe.products.retrieve(productId);

    const invoices = await stripe.invoices.list({
      subscription: subscription.id,
      limit: 1,
    });

    const invoice = invoices.data[0];

    return res.json({
      plan: product.name,
      amount: price.unit_amount,
      currency: price.currency,

      invoice: invoice
        ? {
            id: invoice.id,
            number: invoice.number,
            pdf: invoice.invoice_pdf,
            url: invoice.hosted_invoice_url,
          }
        : null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
