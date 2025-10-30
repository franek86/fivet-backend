"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePagination = parsePagination;
exports.buildPageMeta = buildPageMeta;
function parsePagination(query) {
    var _a, _b;
    const page = Math.max(1, parseInt((_a = query.page) !== null && _a !== void 0 ? _a : "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt((_b = query.limit) !== null && _b !== void 0 ? _b : "10", 10)));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}
function buildPageMeta(total, page, limit) {
    return { total, page, limit, totalPages: Math.ceil(total / limit) };
}
