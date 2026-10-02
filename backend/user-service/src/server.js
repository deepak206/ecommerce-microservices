import "dotenv/config";

import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import userRoutes from "./routes/user.routes.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";

const app = express();
const PORT = Number(process.env.PORT || 3001);

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is required");
}

if (!process.env.RABBITMQ_URL) {
  throw new Error("RABBITMQ_URL is required");
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters");
}

app.disable("x-powered-by");

app.use(cors());
app.use(express.json({ limit: "10kb" }));

app.get("/health", (_req, res) => {
  res.json({
    service: "user-service",
    status: "ok",
    database: mongoose.connection.readyState === 1
      ? "connected"
      : "disconnected",
  });
});

app.use("/api/users", userRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, _req, res, _next) => {
  console.error(error);

  res.status(500).json({
    message: "Internal server error",
  });
});

async function startServer() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  await connectRabbitMQ();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`User Service listening on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start User Service:", error);
  process.exit(1);
});