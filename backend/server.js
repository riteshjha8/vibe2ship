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
import testRoutes from "./routes/testRoutes.js";

console.log("routes loaded");

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const io = new Server(server, {
  cors: { origin: CLIENT_URL, credentials: true },
});

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/integrations", integrationRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/test", testRoutes);

app.use(notFound);
app.use(errorHandler);

console.log("app configured");

initSocket(io);

const PORT = process.env.PORT || 5000;

console.log("connecting to database...");

async function startApp() {
  const dbConnected = await connectDB();

  server.listen(PORT, () => {
    console.log(`Vibe2Ship API running on http://localhost:${PORT}`);
    if (dbConnected) {
      startReminderScheduler(io);
    } else {
      console.warn("Reminder scheduler disabled until MongoDB is available.");
    }
  });
}

startApp();
