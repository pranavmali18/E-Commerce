import { Router } from "express";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import { requireAuth } from "../middleware/auth.js";
import { razorpay, verifyPaymentSignature } from "../utils/razorpay.js";
import { sendEmail, orderConfirmationEmail } from "../utils/email.js";

const router = Router();
router.use(requireAuth);

const SHIPPING_FEE = 0; // flat free shipping for now; swap for real logic if needed

// Recompute the order total server-side from the live cart — never trust client-sent totals.
async function buildOrderPricing(userId, couponCode) {
  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (!cart || cart.items.length === 0) {
    throw { status: 400, message: "Cart is empty" };
  }

  const items = [];
  let itemsTotal = 0;

  for (const ci of cart.items) {
    const product = ci.product;
    if (!product || !product.isActive) {
      throw { status: 400, message: `A product in your cart is no longer available` };
    }
    if (product.stock < ci.quantity) {
      throw { status: 400, message: `Not enough stock for ${product.name}` };
    }
    const unitPrice = product.discountPrice || product.price;
    itemsTotal += unitPrice * ci.quantity;
    items.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0],
      price: unitPrice,
      quantity: ci.quantity,
    });
  }

  let discountAmount = 0;
  let couponInfo = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim() });
    if (!coupon) throw { status: 404, message: "Invalid coupon code" };
    const validity = coupon.isValidFor(itemsTotal);
    if (!validity.ok) throw { status: 400, message: validity.reason };
    discountAmount = Math.round(coupon.calculateDiscount(itemsTotal) * 100) / 100;
    couponInfo = coupon;
  }

  const totalAmount = Math.max(itemsTotal - discountAmount + SHIPPING_FEE, 0);

  return { cart, items, itemsTotal, discountAmount, couponInfo, totalAmount };
}

// POST /api/orders/checkout/razorpay  { addressId, couponCode }
// Step 1: create a pending Order + a Razorpay order to pay against
router.post("/checkout/razorpay", async (req, res) => {
  try {
    const { addressId, couponCode } = req.body;
    if (!addressId) return res.status(400).json({ error: "addressId is required" });

    const address = req.user.addresses.id(addressId);
    if (!address) return res.status(404).json({ error: "Address not found" });

    const { items, itemsTotal, discountAmount, couponInfo, totalAmount } =
      await buildOrderPricing(req.userId, couponCode);

    const order = await Order.create({
      user: req.userId,
      items,
      shippingAddress: {
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        phone: address.phone,
      },
      itemsTotal,
      discountAmount,
      shippingFee: SHIPPING_FEE,
      totalAmount,
      coupon: couponInfo ? { code: couponInfo.code, discountAmount } : undefined,
      paymentMethod: "razorpay",
      paymentStatus: "pending",
      orderStatus: "placed",
      statusHistory: [{ status: "placed" }],
    });

    // Razorpay amounts are in the smallest currency unit (paise for INR)
    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: order._id.toString(),
    });

    order.razorpay = { orderId: rzpOrder.id };
    await order.save();

    res.status(201).json({
      orderId: order._id,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("Checkout error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/orders/checkout/razorpay/verify
// Step 2: verify payment signature, deduct stock, clear cart, send confirmation email
//
// NOTE ON TRANSACTIONS: real ACID transactions (session.withTransaction) require MongoDB
// to be running as a replica set, which a default local `mongod` is NOT. To keep this
// working out of the box against a plain standalone MongoDB install, we do the stock
// deduction as a sequence of atomic per-document updates (each $inc + $gte guard is
// itself atomic) instead of wrapping everything in a multi-document transaction.
// If you later run MongoDB as a replica set (or use Atlas, which always is one), you can
// swap this for a real transaction for stronger guarantees on partial-failure rollback.
router.post("/checkout/razorpay/verify", async (req, res) => {
  try {
    const { orderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (!orderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: "Missing payment verification fields" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.user.toString() !== req.userId) {
      return res.status(403).json({ error: "Not your order" });
    }
    if (order.paymentStatus === "paid") {
      return res.json({ order }); // idempotent: already verified
    }

    const valid = verifyPaymentSignature({
      orderId: order.razorpay.orderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!valid) {
      order.paymentStatus = "failed";
      await order.save();
      return res.status(400).json({ error: "Payment verification failed" });
    }

    // Deduct stock atomically per-item. Payment has already been captured by Razorpay at
    // this point, so on a stock-race failure we still mark the order paid and flag it for
    // manual admin review rather than silently failing — money has already changed hands.
    const stockShortfalls = [];
    const deducted = [];
    for (const item of order.items) {
      const result = await Product.updateOne(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );
      if (result.modifiedCount === 0) {
        stockShortfalls.push(item.name);
      } else {
        deducted.push(item);
      }
    }

    if (order.coupon?.code) {
      await Coupon.updateOne({ code: order.coupon.code }, { $inc: { usedCount: 1 } });
    }

    order.paymentStatus = "paid";
    order.razorpay.paymentId = razorpayPaymentId;
    order.razorpay.signature = razorpaySignature;
    if (stockShortfalls.length > 0) {
      order.orderStatus = "processing";
      order.statusHistory.push({
        status: `processing (stock shortfall: ${stockShortfalls.join(", ")} — needs admin review)`,
      });
    } else {
      order.orderStatus = "processing";
      order.statusHistory.push({ status: "processing" });
    }
    await order.save();

    await Cart.updateOne({ user: req.userId }, { $set: { items: [] } });

    sendEmail({
      to: req.user.email,
      subject: `Order Confirmed - #${order._id}`,
      html: orderConfirmationEmail(order, req.user.name),
    });

    res.json({ order, stockShortfalls: stockShortfalls.length ? stockShortfalls : undefined });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    console.error("Payment verify error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/orders  -> current user's order history
router.get("/", async (req, res) => {
  const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 });
  res.json({ orders });
});

// GET /api/orders/:id
router.get("/:id", async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order || order.user.toString() !== req.userId) {
    return res.status(404).json({ error: "Order not found" });
  }
  res.json({ order });
});

// POST /api/orders/:id/cancel  -> customer-initiated cancellation, only while still placed/processing
router.post("/:id/cancel", async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order || order.user.toString() !== req.userId) {
    return res.status(404).json({ error: "Order not found" });
  }
  if (!["placed", "processing"].includes(order.orderStatus)) {
    return res.status(400).json({ error: `Cannot cancel an order that is ${order.orderStatus}` });
  }

  if (order.paymentStatus === "paid") {
    // Restock items on cancellation
    for (const item of order.items) {
      await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
    }
  }

  order.orderStatus = "cancelled";
  order.statusHistory.push({ status: "cancelled" });
  await order.save();
  res.json({ order });
});

export default router;
