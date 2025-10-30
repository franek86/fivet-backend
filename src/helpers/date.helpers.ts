export const parseDate = (str?: string | null): Date | null => {
  if (!str) return null;

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

export const formatDate = (date: Date | string, locale = "en-US"): string => {
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
