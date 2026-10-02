import { Router } from "express";

import Product from "../models/Product.js";

const router = Router();

// Get all products
router.get("/", async (_req, res, next) => {
  try {
    const products = await Product.find({
      isActive: true,
    }).sort({
      createdAt: -1,
    });

    res.json({
      products,
    });
  } catch (error) {
    next(error);
  }
});

// Reserve product stock
router.post("/reserve", async (req, res, next) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Items are required",
      });
    }

    // Validate request
    for (const item of items) {
      if (
        !item.productId ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return res.status(400).json({
          message: "Invalid product reservation data",
        });
      }
    }

    const reservedItems = [];

    for (const item of items) {
      const product = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          isActive: true,
          stock: { $gte: item.quantity },
        },
        {
          $inc: {
            stock: -item.quantity,
          },
        },
        {
          new: true,
        }
      );

      if (!product) {
        return res.status(409).json({
          message: `Product ${item.productId} is unavailable or has insufficient stock`,
        });
      }

      reservedItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      });
    }

    res.json({
      message: "Stock reserved successfully",
      items: reservedItems,
    });
  } catch (error) {
    next(error);
  }
});

// Get product by ID
router.get("/:id", async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json({
      product,
    });
  } catch (error) {
    next(error);
  }
});

// Create product
router.post("/", async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      category,
      stock,
      image,
    } = req.body;

    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      typeof price !== "number" ||
      price < 0 ||
      typeof category !== "string" ||
      category.trim().length < 2 ||
      typeof stock !== "number" ||
      stock < 0
    ) {
      return res.status(400).json({
        message: "Invalid product data",
      });
    }

    const product = await Product.create({
      name: name.trim(),
      description: description?.trim(),
      price,
      category: category.trim(),
      stock,
      image: image?.trim(),
    });

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
});

export default router;