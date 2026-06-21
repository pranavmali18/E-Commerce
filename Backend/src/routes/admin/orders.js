import { Router } from "express";
import Order from "../../models/Order.js";
import Product from "../../models/Product.js";
import { requireAuth, requireAdmin } from "../../middleware/auth.js";
import { sendEmail, orderStatusUpdateEmail } from "../../utils/email.js";

const router = Router();
router.use(requireAuth, requireAdmin);

const VALID_TRANSITIONS = {
  placed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

// GET /api/admin/orders?status=&page=&limit=
router.get("/", async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.orderStatus = status;

  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.min(Number(limit) || 20, 100);

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Order.countDocuments(filter),
  ]);

  res.json({
    orders,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

router.get("/:id", async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json({ order });
});

// PATCH /api/admin/orders/:id/status  { status }
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) return res.status(404).json({ error: "Order not found" });

    const allowed = VALID_TRANSITIONS[order.orderStatus] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        error: `Cannot move order from "${order.orderStatus}" to "${status}". Allowed: ${
          allowed.join(", ") || "none"
        }`,
      });
    }

    if (status === "cancelled" && order.paymentStatus === "paid") {
      for (const item of order.items) {
        await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
      }
    }

    order.orderStatus = status;
    order.statusHistory.push({ status });
    await order.save();

    sendEmail({
      to: order.user.email,
      subject: `Your order is now ${status}`,
      html: orderStatusUpdateEmail(order, order.user.name),
    });

    res.json({ order });
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
