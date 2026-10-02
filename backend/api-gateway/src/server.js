import "dotenv/config";

import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import { authenticateRequest } from "./middleware/auth.js";

const app = express();

const PORT = Number(process.env.PORT || 3000);

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://user-service:3001";

const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || "http://product-service:3002";

const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL || "http://order-service:3003";

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

app.use(
  "/api/products",
  createProxyMiddleware({
    target: PRODUCT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      "^/": "/api/products/",
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

// Order Service
app.use(
  "/api/orders",
  authenticateRequest,
  createProxyMiddleware({
    target: ORDER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/": "/api/orders/" },
    on: {
      proxyReq: (proxyReq, req) => {
        console.log("Authenticated user:", req.user);

        if (req.user?.sub) {
          proxyReq.setHeader("x-user-id", String(req.user.sub));
        }

        console.log(
          "Forwarding x-user-id:",
          req.user?.sub
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
  console.log(`Product Service: ${PRODUCT_SERVICE_URL}`);
  console.log(`Order Service: ${ORDER_SERVICE_URL}`);
});