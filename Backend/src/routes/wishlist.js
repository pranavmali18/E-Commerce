import { Router } from "express";
import User from "../models/User.js";
import Product from "../models/Product.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const user = await User.findById(req.userId).populate(
    "wishlist",
    "name slug images price discountPrice stock ratingAverage"
  );
  res.json({ wishlist: user.wishlist });
});

router.post("/:productId", async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const user = await User.findById(req.userId);
  if (!user.wishlist.some((id) => id.toString() === req.params.productId)) {
    user.wishlist.push(req.params.productId);
    await user.save();
  }
  res.status(201).json({ wishlist: user.wishlist });
});

router.delete("/:productId", async (req, res) => {
  const user = await User.findById(req.userId);
  user.wishlist = user.wishlist.filter((id) => id.toString() !== req.params.productId);
  await user.save();
  res.json({ wishlist: user.wishlist });
});

export default router;
