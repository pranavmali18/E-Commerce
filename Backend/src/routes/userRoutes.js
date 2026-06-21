import { Router } from "express";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/addresses", async (req, res) => {
  res.json({ addresses: req.user.addresses });
});

router.post("/addresses", async (req, res) => {
  const { label, line1, line2, city, state, postalCode, country, phone, isDefault } = req.body;
  if (!line1 || !city || !state || !postalCode || !phone) {
    return res.status(400).json({ error: "line1, city, state, postalCode, and phone are required" });
  }

  const user = await User.findById(req.userId);

  if (isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }

  user.addresses.push({
    label,
    line1,
    line2,
    city,
    state,
    postalCode,
    country: country || "India",
    phone,
    isDefault: !!isDefault || user.addresses.length === 0,
  });

  await user.save();
  res.status(201).json({ addresses: user.addresses });
});

router.delete("/addresses/:addressId", async (req, res) => {
  const user = await User.findById(req.userId);
  user.addresses = user.addresses.filter(
    (a) => a._id.toString() !== req.params.addressId
  );
  await user.save();
  res.json({ addresses: user.addresses });
});

export default router;
