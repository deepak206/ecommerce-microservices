import "dotenv/config";

import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

const PORT = Number(process.env.PORT || 3000);

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://user-service:3001";

app.disable("x-powered-by");

app.use(cors());

app.get("/health", (_req, res) => {
  res.json({
    service: "api-gateway",
    status: "ok",
  });
});

app.use(
  "/api/users",
  createProxyMiddleware({
    target: USER_SERVICE_URL,
    changeOrigin: true,

    pathRewrite: {
      "^/": "/api/users/",
    },

    on: {
      proxyReq: (proxyReq, req) => {
        console.log(
          `Gateway: ${req.method} ${req.originalUrl} -> ${USER_SERVICE_URL}${req.url}`
        );
      },
    },
  })
);

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API Gateway listening on port ${PORT}`);
  console.log(`User Service: ${USER_SERVICE_URL}`);
});