import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import { authenticateUser } from "../middleware/auth.js";
import { publishEvent } from "../config/rabbitmq.js";
import crypto from "node:crypto";

const router = Router();

function createToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );
}

// POST /api/users/register
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 100 ||
      email.trim().length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      password.length < 8 ||
      password.length > 72
    ) {
      return res.status(400).json({
        message:
          "Provide a valid name and email, and a password of 8–72 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: passwordHash,
    });

    // A broker outage should not cause the client to retry
    // registration for a user who has already been created.
    try {
      await publishEvent("user.registered", {
        eventId: crypto.randomUUID(),
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        occurredAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "Could not publish user.registered event:",
        error.message
      );
      // A durable outbox will be added for reliable delivery.
    }

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: createToken(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    next(error);
  }
});

// POST /api/users/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      email.length > 254 ||
      password.length > 72
    ) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (
      !user ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    return res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: createToken(user),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/me
router.get("/me", authenticateUser, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub).select(
      "_id name email role createdAt"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;