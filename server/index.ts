import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import { healthRouter } from "./routes/health";
import { topicsRouter } from "./routes/topics";
import { practiceRouter } from "./routes/practice";
import { learningRouter } from "./routes/learning";

dotenv.config({ path: "server/.env" });
dotenv.config();

const app = express();
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      try {
        const u = new URL(origin);
        const hostOk = u.hostname === "localhost" || u.hostname === "127.0.0.1";
        if (hostOk) return callback(null, true);
      } catch {
        // fall through
      }
      callback(new Error("CORS origin not allowed"));
    },
    credentials: false,
  }),
);
app.use(express.json({ limit: "2mb" }));

app.use("/health", healthRouter);
app.use("/api/topics", topicsRouter);
app.use("/api/practice", practiceRouter);
app.use("/api/learning", learningRouter);

const port = Number(process.env.PORT ?? 3001);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Practice API running on http://localhost:${port}`);
});
