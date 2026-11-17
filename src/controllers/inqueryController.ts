import { Request, Response } from "express";
import prisma from "../prismaClient";
import { createInquirySchema, idParamsSchema, listQuerySchema, SORT_FIELDS, STATUSES, updateStatusSchema } from "../schemas/inquery.schema";
import { getIO } from "../services/socket.service";
import { sendEmail } from "../utils/sendMail";
import { Prisma } from "@prisma/client";
import { ConflictError } from "../helpers/error.helpers";

const escapeHtml = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

type ShipParams = { shipId: string };
type SortBy = (typeof SORT_FIELDS)[number];

const ORDER_BY: Record<SortBy, (order: Prisma.SortOrder) => Prisma.InquiryOrderByWithRelationInput> = {
  createdAt: (order) => ({ createdAt: order }),
  senderName: (order) => ({ senderName: order }),
  status: (order) => ({ status: order }),
  shipName: (order) => ({ ship: { shipName: order } }),
};

/*
 * Create inquery
 * Public - create inquery for specific vessel from web
 */
export const createInquiry = async (req: Request<ShipParams>, res: Response) => {
  try {
    const { shipId } = req.params;
    const data = createInquirySchema.parse(req.body);

    const ship = await prisma.ship.findFirst({
      where: { id: shipId, isPublished: true, listingStatus: "VERIFIED" },
      select: { id: true, shipName: true, slug: true, listedById: true, listedBy: { select: { email: true, fullName: true } } },
    });
    if (!ship) return res.status(404).json({ message: "Ship not found" });

    const senderId = req.user?.userId ?? null;
    const recipientId = ship.listedById;

    if (senderId && senderId === recipientId) {
      return res.status(400).json({ message: "You cannot send an inquiry to your own listing" });
    }

    const [inquiry, notification] = await prisma.$transaction([
      prisma.inquiry.create({
        data: {
          senderName: data.senderName,
          senderEmail: data.senderEmail,
          senderPhone: data.senderPhone,
          message: data.message,
          subject: data.subject,
          shipId: ship.id,
          recipientId,
          senderId,
        },
      }),
      prisma.notification.create({
        data: {
          userId: recipientId,
          type: "INFO",
          message: `New inquiry for ${ship.shipName} from ${data.senderName} : ${data.subject}`,
        },
      }),
    ]);

    //Send realtime notification
    try {
      const io = getIO();
      io.to(`user:${recipientId}`).emit("notification:new", notification);
      io.to(`user:${recipientId}`).emit("inquiry:new", { id: inquiry.id, shipId: ship.id });
    } catch (err) {
      console.error("Inquiry socket emit failed:", err);
    }

    //Send email to buyer/owner

    const emailData = {
      shipListedName: escapeHtml(ship.listedBy.fullName),
      shipName: escapeHtml(ship.shipName),
      senderName: escapeHtml(data.senderName),
      message: escapeHtml(data.message),
      subject: escapeHtml(data.subject),
      messageLink: `${process.env.FRONTEND_URL}/inquiries`,
    };
    const emailToSend = ship?.listedBy?.email;

    await sendEmail(emailToSend, `New inquiry for ${ship.shipName}`, "ship-inquery-email", emailData);

    res.status(201).json({ id: inquiry.id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: (error as Error).message });
  }
};

/*
 * Get my inquery list
 * Protected - get inquery only for owenr of the vessel
 */
export const getMyInquiries = async (req: Request, res: Response) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query", details: parsed.error.flatten().fieldErrors });
  }

  const { box, status, search, sortBy, order, page, limit } = parsed.data;
  const userId = req.user!.userId;

  // Scope: every user only ever sees their own list
  const scope: Prisma.InquiryWhereInput = box === "received" ? { recipientId: userId } : { senderId: userId };

  const where: Prisma.InquiryWhereInput = {
    ...scope,
    ...(status && { status }),
    ...(search && {
      OR: [
        { senderName: { contains: search, mode: "insensitive" } },
        { senderEmail: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
        { ship: { shipName: { contains: search, mode: "insensitive" } } },
      ],
    }),
  };

  try {
    const [items, total, grouped] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        // id as tie-breaker keeps pagination stable when sort values are equal
        orderBy: [ORDER_BY[sortBy](order), { id: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          senderName: true,
          senderEmail: true,
          senderPhone: true,
          message: true,
          subject: true,
          status: true,
          createdAt: true,
          ship: {
            select: { id: true, shipName: true, slug: true, mainImage: true, price: true, currency: true },
          },
        },
      }),
      prisma.inquiry.count({ where }),
      // tab counters: same scope, but ignoring status/search filters
      prisma.inquiry.groupBy({
        by: ["status"],
        where: scope,
        _count: { _all: true },
      }),
    ]);

    const counts: Record<(typeof STATUSES)[number], number> = { OPEN: 0, RESPONDED: 0, CLOSED: 0 };
    for (const g of grouped) counts[g.status] = g._count._all;

    res.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      counts,
    });
  } catch (error) {
    console.error("Get inquiries error:", error);
    res.status(500).json({ error: "Could not load inquiries" });
  }
};

/*
 * Update inquery status
 * Protected - only owner can update status
 */
export const updateInqueryStatus = async (req: Request, res: Response) => {
  const params = idParamsSchema.safeParse(req.params);
  const body = updateStatusSchema.safeParse(req.body);

  if (!params.success || !body.success) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    const result = await prisma.inquiry.updateMany({
      where: { id: params.data.id, recipientId: req.user!.userId },
      data: { status: body.data.status },
    });
    if (result.count === 0) return res.status(404).json({ error: "Inquiry not found" });

    res.json({ id: params.data.id, status: body.data.status });
  } catch (error) {
    console.error("Update inquiry status error:", error);
    res.status(500).json({ error: "Could not load inquiries" });
  }
};

/*
 * Delete inquery
 * Protected - only owner ca delete inquery
 */

export const deleteInquiry = async (req: Request, res: Response) => {
  const params = idParamsSchema.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid inquiry id" });

  try {
    const result = await prisma.inquiry.deleteMany({
      where: { id: params.data.id, recipientId: req.user!.userId },
    });
    if (result.count === 0) return res.status(404).json({ error: "Inquiry not found" });

    res.status(204).send();
  } catch (error) {
    console.error("Delete inquiry error:", error);
    res.status(500).json({ error: "Could not delete inquiry" });
  }
};

/*
 * Save sender to address book
 * Protected
 */

export const saveInquirySenderToAddressBook = async (req: Request, res: Response) => {
  console.log("Request param id ========= ", req.params);
  const params = idParamsSchema.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid inquiry id" });

  const userId = req.user!.userId;

  try {
    // recipientId in the WHERE = only the owner/broker who received the inquiry can use it
    const inquiry = await prisma.inquiry.findFirst({
      where: { id: params.data.id, recipientId: userId },
      select: {
        senderName: true,
        senderEmail: true,
        senderPhone: true,
        ship: { select: { shipName: true } },
      },
    });
    if (!inquiry) return res.status(404).json({ error: "Inquiry not found" });

    // addressBook has no unique (userId, email), so check for a duplicate first
    const existing = await prisma.addressBook.findFirst({
      where: { userId, email: { equals: inquiry.senderEmail, mode: "insensitive" } },
      select: { id: true },
    });

    if (existing) throw new ConflictError("Contact already exists in the address book");

    const contact = await prisma.addressBook.create({
      data: {
        userId,
        fullName: inquiry.senderName,
        email: inquiry.senderEmail,
        phone_number: inquiry.senderPhone,
        note: `Inquiry about ${inquiry.ship.shipName}`,
      },
    });

    console.log(contact);

    res.status(201).json({ id: contact.id, alreadyExists: false });
  } catch (error) {
    console.error("Save sender to address book error:", error);
    res.status(500).json({ error: "Could not save contact" });
  }
};
