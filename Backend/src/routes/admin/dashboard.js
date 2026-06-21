import { Router } from "express";
import Order from "../../models/Order.js";
import Product from "../../models/Product.js";
import User from "../../models/User.js";
import { requireAuth, requireAdmin } from "../../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

// GET /api/admin/dashboard/summary
router.get("/summary", async (req, res) => {
  const [revenueAgg, orderCounts, userCount, productCount, lowStockCount] = await Promise.all([
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" }, totalOrders: { $sum: 1 } } },
    ]),
    Order.aggregate([{ $group: { _id: "$orderStatus", count: { $sum: 1 } } }]),
    User.countDocuments({ role: "customer" }),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true, stock: { $lte: 5 } }),
  ]);

  const statusBreakdown = {};
  orderCounts.forEach((s) => (statusBreakdown[s._id] = s.count));

  res.json({
    totalRevenue: revenueAgg[0]?.totalRevenue || 0,
    totalPaidOrders: revenueAgg[0]?.totalOrders || 0,
    statusBreakdown,
    totalUsers: userCount,
    totalActiveProducts: productCount,
    lowStockCount,
  });
});

// GET /api/admin/dashboard/revenue-trend?days=30
router.get("/revenue-trend", async (req, res) => {
  const days = Math.min(Number(req.query.days) || 30, 365);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const trend = await Order.aggregate([
    { $match: { paymentStatus: "paid", createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$totalAmount" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({ trend: trend.map((t) => ({ date: t._id, revenue: t.revenue, orders: t.orders })) });
});

// GET /api/admin/dashboard/top-products?limit=10
router.get("/top-products", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);

  const topProducts = await Order.aggregate([
    { $match: { paymentStatus: "paid" } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        name: { $first: "$items.name" },
        unitsSold: { $sum: "$items.quantity" },
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: limit },
  ]);

  res.json({ topProducts });
});

export default router;
