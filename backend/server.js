import "dotenv/config";
console.log("dotenv loaded");

import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

console.log("dependencies loaded");

import connectDB from "./config/db.js";
import { initSocket } from "./sockets/index.js";
import { startReminderScheduler } from "./services/reminderScheduler.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

console.log("modules loaded");

import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import goalRoutes from "./routes/goalRoutes.js";
import habitRoutes from "./routes/habitRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import integrationRoutes from "./routes/integrationRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import meetingRoutes from "./routes/meetingRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";

console.log("routes loaded");

const app = express();
const server = http.createServer(app);

<<<<<<< HEAD
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
const extraAllowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : [];
const allowedOrigins = [
  CLIENT_URL,
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  ...extraAllowedOrigins,
].filter(Boolean);
const uniqueAllowedOrigins = [...new Set(allowedOrigins)];
=======
const CLIENT_URL = process.env.CLIENT_URL || "https://vibe2ship-six.vercel.app";
console.log(`[CORS] CLIENT_URL resolved to: "${CLIENT_URL}" (process.env.CLIENT_URL="${process.env.CLIENT_URL}")`);

const allowedOrigins = [
  CLIENT_URL,
  "https://vibe2ship-six.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];
>>>>>>> 8dffeb7eeb14fbfa8621f0b632226439dac930b8

const corsOptions = {
  origin(origin, callback) {
    if (!origin || uniqueAllowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS policy does not allow access from origin ${origin}`));
  },
  credentials: true,
};

const io = new Server(server, {
  cors: corsOptions,
});

app.use(cors(corsOptions));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/integrations", integrationRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/test", testRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/assignments", assignmentRoutes);

app.use(notFound);
app.use(errorHandler);

console.log("app configured");

initSocket(io);

const DEFAULT_PORT = Number(process.env.PORT || 5000);

console.log("connecting to database...");

async function startApp() {
  const dbConnected = await connectDB();

  // Try to bind to the default port; if in use, try the next few ports.
  const maxAttempts = 5;
  let attempt = 0;
  let port = DEFAULT_PORT;

  function tryListen(p) {
    attempt++;
    server.once("error", (err) => {
      if (err && err.code === "EADDRINUSE") {
        console.warn(`Port ${p} in use.`);
        if (attempt < maxAttempts) {
          port = DEFAULT_PORT + attempt; // try next port
          console.log(`Attempting to listen on port ${port} instead...`);
          tryListen(port);
        } else {
          console.error(`All ${maxAttempts} port attempts failed. Please free port ${DEFAULT_PORT} or set PORT env.`);
          process.exit(1);
        }
      } else {
        console.error("Server error:", err);
        process.exit(1);
      }
    });

    server.listen(p, () => {
      console.log(`Vibe2Ship API running on http://localhost:${p}`);
      if (dbConnected) {
        startReminderScheduler(io);
      } else {
        console.warn("Reminder scheduler disabled until MongoDB is available.");
      }
    });
  }

  tryListen(port);
}

startApp();
