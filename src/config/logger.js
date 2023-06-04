import { createLogger, format, transports } from "winston";
import "winston-daily-rotate-file";
import path from "path";
import { fileURLToPath } from "url";

const { combine, timestamp, prettyPrint } = format;
const { Console, DailyRotateFile } = transports;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = createLogger({
  format: combine(
    timestamp({
      format: new Date().toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      }),
    }),
    prettyPrint()
  ),
  transports: [
    new Console(),
    new DailyRotateFile({
      filename: path.join(__dirname, "..", "..", "logs", `%DATE%.log`),
      datePattern: "DD-MM-YYYY",
    }),
  ],
});

export default logger;
