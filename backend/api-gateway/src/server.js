import "dotenv/config";
import cluster from "node:cluster";
import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import { authenticateRequest } from "./middleware/auth.js";

import fs from "fs";
import path from "path";
import crypto from "crypto";
import v8 from "v8"; 

import {
  apiRateLimiter,
  authRateLimiter,
} from "./middleware/rateLimiter.js";

import profiler from "./middleware/profiler.js";

const app = express();

const PORT = Number(process.env.PORT || 3000);

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://user-service:3001";

const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || "http://product-service:3002";

const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL || "http://order-service:3003";

const DIAGNOSTICS_TOKEN = process.env.DIAGNOSTICS_TOKEN || "random-key-for-diagnostics";
const ENABLE_DIAGNOSTICS = process.env.ENABLE_DIAGNOSTICS || "true";

app.disable("x-powered-by");
app.use(cors());

app.use(apiRateLimiter);
//app.use(profiler);


// Enable only when explicitly configured.
app.post('/internal/heap-snapshot', (req, res) => {
  console.log('asdsdsdsd ---------------', ENABLE_DIAGNOSTICS, DIAGNOSTICS_TOKEN, req.get('x-diagnostics-token'));
  if (ENABLE_DIAGNOSTICS !== 'true') {
    return res.sendStatus(404);
  }

  const expected = DIAGNOSTICS_TOKEN || '';
  const supplied = req.get('x-diagnostics-token') || '';

  if (
    !expected ||
    expected.length !== supplied.length ||
    !crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(supplied)
    )
  ) {
    return res.sendStatus(403);
  }

  try {
    const directory = path.resolve('./profiles');

    fs.mkdirSync(directory, { recursive: true });

    const filename = path.join(
      directory,
      `Heap-${Date.now()}-${process.pid}.heapsnapshot`
    );


    console.log("Current working directory:", process.cwd());
    console.log("Snapshot directory:", directory);
        // Synchronous and potentially expensive.
        const snapshotPath = v8.writeHeapSnapshot(filename);

    console.log("Snapshot created at:", snapshotPath);
    console.log("File exists:", fs.existsSync(snapshotPath));
    console.log(
      "File size:",
      fs.statSync(snapshotPath).size,
      "bytes"
    );

    res.json({
      message: "Heap snapshot created",
      filename: path.basename(snapshotPath),
      fullPath: snapshotPath,
      sizeBytes: fs.statSync(snapshotPath).size,
    })
  } catch (error) {
    console.error('Heap snapshot failed:', error.message);
    res.status(500).json({ message: 'Snapshot failed' });
  }
});


app.get("/health", (_req, res) => {
  res.json({
    service: "api-gateway",
    status: "ok",
  });
});

app.use(
  "/api/users/login",
  authRateLimiter
);

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
  console.log(
    `API Gateway worker ${
      cluster.worker?.id ?? "unknown"
    } listening on port ${PORT} (PID ${process.pid})`
  );
});