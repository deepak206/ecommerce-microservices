import "dotenv/config";

import express from "express";
import cors from "cors";

import { connectDatabase } from "./config/database.js";
import productRoutes from "./routes/product.routes.js";

const app = express();

const PORT = Number(process.env.PORT || 3002);

app.disable("x-powered-by");

app.use(cors());

app.use(express.json({ limit: "10kb" }));

app.get("/health", (_req, res) => {
  res.json({
    service: "product-service",
    status: "ok",
  });
});

app.use("/api/products", productRoutes);

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

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Product Service listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start Product Service:", error);
    process.exit(1);
  }
}

startServer();