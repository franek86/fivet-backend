"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateNotificationSchema = void 0;
const zod_1 = require("zod");
exports.UpdateNotificationSchema = zod_1.z.object({
    isRead: zod_1.z.boolean(),
});
