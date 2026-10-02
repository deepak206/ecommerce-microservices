import "dotenv/config";

import express from "express";
import cors from "cors";

import { connectDatabase } from "./config/database.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import orderRoutes from "./routes/order.routes.js";

const app = express();

const PORT = Number(process.env.PORT || 3003);

app.disable("x-powered-by");

app.use(cors());

app.use(express.json({ limit: "20kb" }));

app.get("/health", (_req, res) => {
  res.json({
    service: "order-service",
    status: "ok",
  });
});

app.use("/api/orders", orderRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

app.use((error, _req, res, _next) => {
  console.error(error);

  res.status(500).json({
    message: "Internal server error",
  });
});

async function startServer() {
  try {
    await connectDatabase();

    await connectRabbitMQ();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Order Service listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start Order Service:", error);
    process.exit(1);
  }
}

startServer();