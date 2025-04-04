"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaginationParams = void 0;
const getPaginationParams = (query) => {
    const pageNumber = parseInt(query.page) || 1;
    const pageSize = parseInt(query.limit) || 10;
    const skip = (pageNumber - 1) * pageSize;
    return { pageNumber, pageSize, skip };
};
exports.getPaginationParams = getPaginationParams;
