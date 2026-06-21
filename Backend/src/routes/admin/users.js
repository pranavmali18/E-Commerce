import { Router } from "express";
import User from "../../models/User.js";
import { requireAuth, requireAdmin } from "../../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

// GET /api/admin/users?search=&page=&limit=
router.get("/", async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.min(Number(limit) || 20, 100);

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  res.json({
    users,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  });
});

// PATCH /api/admin/users/:id/status  { isActive }
router.patch("/:id/status", async (req, res) => {
  const { isActive } = req.body;
  if (req.params.id === req.userId) {
    return res.status(400).json({ error: "You cannot deactivate your own account" });
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: !!isActive },
    { new: true }
  ).select("-passwordHash");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user });
});

// PATCH /api/admin/users/:id/role  { role }
router.patch("/:id/role", async (req, res) => {
  const { role } = req.body;
  if (!["customer", "admin"].includes(role)) {
    return res.status(400).json({ error: "role must be 'customer' or 'admin'" });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select(
    "-passwordHash"
  );
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user });
});

export default router;
