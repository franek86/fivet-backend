"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentFilters = void 0;
const client_1 = require("@prisma/client");
const date_helpers_1 = require("../helpers/date.helpers");
const paymentFilters = (query) => {
    const where = {};
    // Filter by status PENDING ,PAID, FAILED ,CANCELED
    if (query.status) {
        const status = query.status.toUpperCase();
        if (Object.values(client_1.PaymentStatus).includes(status)) {
            where.status = status;
        }
    }
    //Filter by date range
    const dateFrom = (0, date_helpers_1.parseDate)(query.dateFrom);
    const dateTo = (0, date_helpers_1.parseDate)(query.dateTo);
    where.createdAt = Object.assign(Object.assign({}, (dateFrom && { gte: dateFrom })), (dateTo && { lte: dateTo }));
    return { where };
};
exports.paymentFilters = paymentFilters;
