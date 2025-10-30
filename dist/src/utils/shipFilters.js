"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shipFilters = void 0;
const date_helpers_1 = require("../helpers/date.helpers");
// src/utils/shipFilters.ts
const shipFilters = (query) => {
    const { price, shipType, dateFrom, dateTo, isPublished, search } = query;
    const where = {};
    if (search && typeof search === "string" && search.trim().length > 0) {
        where.OR = [{ shipName: { contains: search.trim(), mode: "insensitive" } }];
    }
    // Is published
    if (isPublished === "true") {
        where.isPublished = true;
    }
    else if (isPublished === "false") {
        where.isPublished = false;
    }
    if (price) {
        // Price
        const [min, max] = price.split("-").map(Number);
        where.price = {};
        if (!isNaN(min))
            where.price.gte = min;
        if (!isNaN(max))
            where.price.lte = max;
    }
    // Ship type
    if (shipType) {
        where.shipType = {
            in: shipType.split(",").map((t) => t.trim()),
        };
    }
    // Date range
    const dateFromInit = (0, date_helpers_1.parseDate)(dateFrom);
    const dateToInit = (0, date_helpers_1.parseDate)(dateTo);
    where.createdAt = Object.assign(Object.assign({}, (dateFromInit && { gte: dateFromInit })), (dateToInit && { lte: dateToInit }));
    return where;
};
exports.shipFilters = shipFilters;
