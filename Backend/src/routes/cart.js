import { Router } from "express";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

async function populatedCart(userId) {
  const cart = await Cart.findOne({ user: userId }).populate(
    "items.product",
    "name slug images price discountPrice stock isActive"
  );
  return cart;
}

router.get("/", async (req, res) => {
  await getOrCreateCart(req.userId);
  const cart = await populatedCart(req.userId);
  res.json({ cart });
});

router.post("/items", async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ error: "productId is required" });

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ error: "Product not found" });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ error: "Not enough stock available" });
    }

    const cart = await getOrCreateCart(req.userId);
    const existing = cart.items.find((i) => i.product.toString() === productId);

    if (existing) {
      const newQty = existing.quantity + Number(quantity);
      if (newQty > product.stock) {
        return res.status(400).json({ error: "Not enough stock available" });
      }
      existing.quantity = newQty;
    } else {
      cart.items.push({
        product: productId,
        quantity: Number(quantity),
        priceAtAdd: product.discountPrice || product.price,
      });
    }

    await cart.save();
    res.json({ cart: await populatedCart(req.userId) });
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/items/:productId", async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: "quantity must be at least 1" });
    }

    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (quantity > product.stock) {
      return res.status(400).json({ error: "Not enough stock available" });
    }

    const cart = await getOrCreateCart(req.userId);
    const item = cart.items.find((i) => i.product.toString() === req.params.productId);
    if (!item) return res.status(404).json({ error: "Item not in cart" });

    item.quantity = Number(quantity);
    await cart.save();
    res.json({ cart: await populatedCart(req.userId) });
  } catch (err) {
    console.error("Update cart error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/items/:productId", async (req, res) => {
  const cart = await getOrCreateCart(req.userId);
  cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  await cart.save();
  res.json({ cart: await populatedCart(req.userId) });
});

router.delete("/", async (req, res) => {
  const cart = await getOrCreateCart(req.userId);
  cart.items = [];
  await cart.save();
  res.json({ cart });
});

export default router;
