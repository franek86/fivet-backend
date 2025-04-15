"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shipSchema = void 0;
const zod_1 = require("zod");
const currentYear = new Date().getFullYear();
exports.shipSchema = zod_1.z.object({
    shipName: zod_1.z.string().min(1, "Ship name is required"),
    imo: zod_1.z.string().min(1, "Ship IMO is required"),
    refitYear: zod_1.z.coerce
        .number()
        .int()
        .positive()
        .max(currentYear, { message: `Year must be ${currentYear} or earlier` })
        .optional(),
    buildYear: zod_1.z.coerce
        .number()
        .int()
        .positive()
        .max(currentYear, { message: `Year must be ${currentYear} or earlier` })
        .optional(),
    price: zod_1.z.coerce.number({ required_error: "Price is required", invalid_type_error: "Price must be a number" }).positive(),
    location: zod_1.z.string().min(1, "Ship location is required"),
    mainEngine: zod_1.z.string().min(1, "Main engine is required"),
    lengthOverall: zod_1.z.string().min(1, "Leght overall is required"),
    beam: zod_1.z.coerce.number({ required_error: "Beam is required", invalid_type_error: "Beam must be a number" }).positive(),
    length: zod_1.z.coerce.number({ required_error: "Length is required", invalid_type_error: "Length must be a number" }).positive(),
    depth: zod_1.z.coerce.number({ required_error: "Depth is required", invalid_type_error: "Depth must be a number" }).positive(),
    draft: zod_1.z.coerce.number({ required_error: "Draft is required", invalid_type_error: "Draft must be a number" }).positive(),
    tonnage: zod_1.z.coerce.number({ required_error: "Tonnage is required", invalid_type_error: "Tonnage must be a number" }).positive(),
    cargoCapacity: zod_1.z.string().min(1, "Cargo capacity is required"),
    buildCountry: zod_1.z.string().min(1, "Build country is required"),
    remarks: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    userId: zod_1.z.string().uuid(),
    typeId: zod_1.z.string().uuid(),
});
