"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSortBy = void 0;
const parseSortBy = (sortBy, allowedFields = [], defaultSort = { createdAt: "desc" }) => {
    if (!sortBy || typeof sortBy !== "string")
        return [defaultSort];
    const sortParse = sortBy.split(",");
    const parsed = sortParse
        .map((part) => {
        const [field, direction] = part.split("-");
        if (allowedFields.includes(field) && ["asc", "desc"].includes(direction)) {
            return { [field]: direction };
        }
        return null;
    })
        .filter(Boolean);
    return parsed.length > 0 ? parsed : [defaultSort];
};
exports.parseSortBy = parseSortBy;
