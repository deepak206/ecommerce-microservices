import { Router } from "express";
import crypto from "node:crypto";

import Order from "../models/Order.js";
import { publishEvent } from "../config/rabbitmq.js";

const router = Router();

/*
  Create Order
  POST /api/orders
*/
router.post("/", async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({
        message: "User authentication is required",
      });
    }

    const {
      items,
      shippingAddress,
    } = req.body;

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

    const normalizedItems = items.map((item) => ({
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

    try {
      await publishEvent("order.created", {
        eventId: crypto.randomUUID(),
        orderId: order._id.toString(),
        userId: userId.toString(),
        totalAmount: order.totalAmount,
        items: order.items,
        occurredAt: new Date().toISOString(),
      });
    } catch (eventError) {
      console.error(
        "Failed to publish order.created:",
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