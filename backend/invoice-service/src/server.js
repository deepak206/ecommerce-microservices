import "dotenv/config";

import express from "express";
import cors from "cors";

import { connectRabbitMQ } from "./config/rabbitmq.js";
import { connectKafka } from "./config/kafka.js";

const app = express();

const PORT = Number(
  process.env.PORT || 3005
);

app.disable("x-powered-by");

app.use(cors());

app.get("/health", (_req, res) => {
  res.json({
    service: "invoice-service",
    status: "ok",
  });
});

async function startServer() {
  try {
    await connectRabbitMQ();
    await connectKafka();

    app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          `Invoice Service listening on port ${PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      "Failed to start Invoice Service:",
      error
    );

    process.exit(1);
  }
}

startServer();