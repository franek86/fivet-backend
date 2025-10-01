"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = void 0;
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
