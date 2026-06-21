import { Router } from "express";
import Coupon from "../models/Coupon.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// POST /api/coupons/validate  { code, orderAmount }
router.post("/validate", async (req, res) => {
  const { code, orderAmount } = req.body;
  if (!code || orderAmount == null) {
    return res.status(400).json({ error: "code and orderAmount are required" });
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
  if (!coupon) {
    return res.status(404).json({ error: "Invalid coupon code" });
  }

  const validity = coupon.isValidFor(Number(orderAmount));
  if (!validity.ok) {
    return res.status(400).json({ error: validity.reason });
  }

  const discount = coupon.calculateDiscount(Number(orderAmount));
  res.json({
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount: Math.round(discount * 100) / 100,
  });
});

export default router;
