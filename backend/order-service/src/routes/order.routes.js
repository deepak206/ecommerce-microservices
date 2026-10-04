import { Router } from "express";
import crypto from "node:crypto";

import Order from "../models/Order.js";
import { publishEvent } from "../config/rabbitmq.js";
import { publishKafkaEvent } from "../config/kafka.js";


const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || "http://product-service:3002";

const router = Router();

/*
  Create Order
  POST /api/orders
*/
router.post("/", async (req, res, next) => {

    console.log("========== ORDER REQUEST ==========");
    console.log("Authorization:", req.headers.authorization);
    console.log("x-user-id:", req.headers["x-user-id"]);
    console.log("===================================");
    
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({
        message: "User authentication is required",
      });
    }

    const { items, shippingAddress } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Order must contain at least one item",
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        message: "Shipping address is required",
      });
    }

    const reservationResponse = await fetch(
      `${PRODUCT_SERVICE_URL}/api/products/reserve`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      }
    );

    const reservationData = await reservationResponse.json();

    if (!reservationResponse.ok) {
      return res.status(reservationResponse.status).json({
        message:
          reservationData.message || "Unable to reserve product stock",
      });
    }

    const normalizedItems = reservationData.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    }));

    const totalAmount = normalizedItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    const order = await Order.create({
      userId,
      items: normalizedItems,
      totalAmount,
      shippingAddress,
      status: "PENDING",
    });

    const orderEvent = {
      eventId: crypto.randomUUID(),
      orderId: order._id.toString(),
      userId: userId.toString(),
      totalAmount: order.totalAmount,
      items: order.items,
      occurredAt: new Date().toISOString(),
    };

    // Publish to RabbitMQ
    try {
      await publishEvent("order.created", orderEvent);
    } catch (eventError) {
      console.error(
        "Failed to publish order.created to RabbitMQ:",
        eventError.message
      );
    }

    // Publish to Kafka independently
    try {
      await publishKafkaEvent("order.created", orderEvent);
    } catch (eventError) {
      console.error(
        "Failed to publish order.created to Kafka:",
        eventError.message
      );
    }


    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
});


/*
  Get current user's orders
  GET /api/orders/my-orders
*/
router.get("/my-orders", async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({
        message: "User authentication is required",
      });
    }

    const orders = await Order.find({
      userId,
    }).sort({
      createdAt: -1,
    });

    res.json({
      orders,
    });
  } catch (error) {
    next(error);
  }
});


/*
  Get order by ID
  GET /api/orders/:id
*/
router.get("/:id", async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({
        message: "User authentication is required",
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      userId,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.json({
      order,
    });
  } catch (error) {
    next(error);
  }
});

export default router;