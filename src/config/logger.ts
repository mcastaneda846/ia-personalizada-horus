import pino from "pino";
import { env } from "./env";

const logger = pino(
  env.NODE_ENV === "development"
    ? {
        level: "debug",
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss" },
        },
      }
    : {
        level: "info",
      }
);

export default logger;
