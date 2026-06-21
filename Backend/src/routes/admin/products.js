import { Router } from "express";
import slugify from "slugify";
import Product from "../../models/Product.js";
import { requireAuth, requireAdmin } from "../../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

// GET /api/admin/products?page=&limit=&search=
router.get("/", async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const filter = {};
  if (search) filter.name = { $regex: search, $options: "i" };

  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.min(Number(limit) || 20, 100);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .select("-reviews")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.json({ products, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } });
});

router.post("/", async (req, res) => {
  try {
    const { name, description, price, discountPrice, category, brand, images, stock, sku } = req.body;

    if (!name || !description || price == null || !category || stock == null) {
      return res.status(400).json({ error: "name, description, price, category, and stock are required" });
    }

    let slug = slugify(name, { lower: true, strict: true });
    const exists = await Product.findOne({ slug });
    if (exists) slug = `${slug}-${Date.now().toString(36)}`;

    const product = await Product.create({
      name,
      slug,
      description,
      price,
      discountPrice: discountPrice || undefined,
      category,
      brand: brand || "",
      images: images || [],
      stock,
      sku: sku || undefined,
      createdBy: req.userId,
    });

    res.status(201).json({ product });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "A product with that SKU already exists" });
    }
    console.error("Create product error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.slug; // slug stays stable once created
    delete updates.reviews;
    delete updates.ratingAverage;
    delete updates.ratingCount;

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ product });
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json({ message: "Product deactivated", product });
});

// PATCH /api/admin/products/:id/stock  { stock }  -> direct inventory adjustment
router.patch("/:id/stock", async (req, res) => {
  const { stock } = req.body;
  if (stock == null || stock < 0) {
    return res.status(400).json({ error: "A valid non-negative stock value is required" });
  }
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { stock },
    { new: true }
  );
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json({ product });
});

export default router;
