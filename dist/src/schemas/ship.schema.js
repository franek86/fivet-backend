"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditShipSchema = exports.CreateShipSchema = void 0;
const zod_1 = require("zod");
exports.CreateShipSchema = zod_1.z.object({
    shipName: zod_1.z.string().min(1),
    slug: zod_1.z.string().min(1),
    typeId: zod_1.z.string().optional(),
    imo: zod_1.z.coerce.number().int(),
    refitYear: zod_1.z.coerce.number().int().optional(),
    buildYear: zod_1.z.coerce.number().int().optional(),
    price: zod_1.z.coerce.number(),
    location: zod_1.z.string().optional(),
    mainEngine: zod_1.z.string().optional(),
    lengthOverall: zod_1.z.coerce.number().optional(),
    beam: zod_1.z.coerce.number().optional(),
    length: zod_1.z.coerce.number().optional(),
    depth: zod_1.z.coerce.number().optional(),
    draft: zod_1.z.coerce.number().optional(),
    tonnage: zod_1.z.coerce.number().optional(),
    cargoCapacity: zod_1.z.string().optional(),
    buildCountry: zod_1.z.string().optional(),
    remarks: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    mainImage: zod_1.z.string().url(),
    images: zod_1.z.array(zod_1.z.string()).optional(),
    isPublished: zod_1.z.coerce.boolean().optional().default(false),
});
exports.EditShipSchema = exports.CreateShipSchema.partial();
