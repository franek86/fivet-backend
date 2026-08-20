import pino from "pino";

const isDevelopment = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  ...(isDevelopment && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  }),

  base: {
    service: "my-api",
  },

  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "password", "token", "accessToken", "refreshToken"],
    censor: "[REDACTED]",
  },
});
