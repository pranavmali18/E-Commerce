import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ["percentage", "flat"], required: true },
    discountValue: { type: Number, required: true, min: 0 }, // % or flat amount
    minOrderAmount: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number }, // cap for percentage coupons
    expiresAt: { type: Date, required: true },
    usageLimit: { type: Number, default: null }, // null = unlimited
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.methods.isValidFor = function (orderAmount) {
  if (!this.isActive) return { ok: false, reason: "Coupon is inactive" };
  if (this.expiresAt < new Date()) return { ok: false, reason: "Coupon has expired" };
  if (this.usageLimit !== null && this.usedCount >= this.usageLimit)
    return { ok: false, reason: "Coupon usage limit reached" };
  if (orderAmount < this.minOrderAmount)
    return { ok: false, reason: `Minimum order amount is ${this.minOrderAmount}` };
  return { ok: true };
};

couponSchema.methods.calculateDiscount = function (orderAmount) {
  let discount =
    this.discountType === "percentage"
      ? (orderAmount * this.discountValue) / 100
      : this.discountValue;
  if (this.maxDiscountAmount) discount = Math.min(discount, this.maxDiscountAmount);
  return Math.min(discount, orderAmount);
};

export default mongoose.model("Coupon", couponSchema);
