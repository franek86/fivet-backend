"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDate = void 0;
const parseDate = (str) => {
    if (!str)
        return null;
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
};
exports.parseDate = parseDate;
