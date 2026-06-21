import { Router } from "express";
import Coupon from "../../models/Coupon.js";
import { requireAuth, requireAdmin } from "../../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/", async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ coupons });
});

router.post("/", async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      expiresAt,
      usageLimit,
    } = req.body;

    if (!code || !discountType || discountValue == null || !expiresAt) {
      return res
        .status(400)
        .json({ error: "code, discountType, discountValue, and expiresAt are required" });
    }
    if (!["percentage", "flat"].includes(discountType)) {
      return res.status(400).json({ error: "discountType must be 'percentage' or 'flat'" });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscountAmount: maxDiscountAmount || undefined,
      expiresAt,
      usageLimit: usageLimit ?? null,
    });

    res.status(201).json({ coupon });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "A coupon with that code already exists" });
    }
    console.error("Create coupon error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  const updates = { ...req.body };
  if (updates.code) updates.code = updates.code.toUpperCase().trim();
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!coupon) return res.status(404).json({ error: "Coupon not found" });
  res.json({ coupon });
});

router.delete("/:id", async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!coupon) return res.status(404).json({ error: "Coupon not found" });
  res.json({ message: "Coupon deactivated", coupon });
});

export default router;
