"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = exports.parseDate = void 0;
const parseDate = (str) => {
    if (!str)
        return null;
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
};
exports.parseDate = parseDate;
const formatDate = (date, locale = "en-US") => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
};
exports.formatDate = formatDate;
