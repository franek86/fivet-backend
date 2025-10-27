"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAddressBookSchema = exports.AddressBookSchema = void 0;
const zod_1 = require("zod");
const StatusEnum = zod_1.z.enum(["REGULAR", "IMPORTANT"]);
exports.AddressBookSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(1, "Full name is required"),
    email: zod_1.z.string().email(),
    phone_number: zod_1.z.string().optional().nullable(),
    mobile_number: zod_1.z.string().optional().nullable(),
    country: zod_1.z.string().optional().nullable(),
    address_2: zod_1.z.string().optional().nullable(),
    web_link: zod_1.z.string().optional().nullable(),
    linkedin_link: zod_1.z.string().optional().nullable(),
    facebook_link: zod_1.z.string().optional().nullable(),
    instagram_link: zod_1.z.string().optional().nullable(),
    tiktok_link: zod_1.z.string().optional().nullable(),
    priority: StatusEnum.default("REGULAR"),
    company: zod_1.z.string().optional().nullable(),
    address: zod_1.z.string().optional().nullable(),
    userId: zod_1.z.string().uuid("User ID must be valid"),
});
exports.UpdateAddressBookSchema = exports.AddressBookSchema.partial();
