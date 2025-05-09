"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressBookSchema = void 0;
const zod_1 = require("zod");
const StatusEnum = zod_1.z.enum(["REGULAR", "IMPORTANT"]);
exports.addressBookSchema = zod_1.z.object({
    fullName: zod_1.z.string(),
    email: zod_1.z.string().email(),
    phone_number: zod_1.z.string(),
    mobile_number: zod_1.z.string(),
    country: zod_1.z.string(),
    address_2: zod_1.z.string(),
    web_link: zod_1.z.string().url().optional(),
    linkedin_link: zod_1.z.string().url().optional(),
    facebook_link: zod_1.z.string().url().optional(),
    instagram_link: zod_1.z.string().url().optional(),
    tiktok_link: zod_1.z.string().url().optional(),
    priority: StatusEnum.default("REGULAR"),
    company: zod_1.z.string(),
    address: zod_1.z.string(),
    userId: zod_1.z.string().uuid(),
});
