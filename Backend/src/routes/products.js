import { Router } from "express";
import Product from "../models/Product.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/products?search=&category=&minPrice=&maxPrice=&brand=&sort=&page=&limit=&rating=
router.get("/", async (req, res) => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      rating,
      sort = "newest",
      page = 1,
      limit = 12,
    } = req.query;

    const filter = { isActive: true };

    if (search) {
      filter.$text = { $search: search };
    }
    if (category) {
      filter.category = category;
    }
    if (brand) {
      filter.brand = brand;
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (rating) {
      filter.ratingAverage = { $gte: Number(rating) };
    }

    const sortMap = {
      newest: { createdAt: -1 },
      priceLow: { price: 1 },
      priceHigh: { price: -1 },
      rating: { ratingAverage: -1 },
      popular: { ratingCount: -1 },
    };
    const sortBy = sortMap[sort] || sortMap.newest;

    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Number(limit) || 12, 50);
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select("-reviews") // list view doesn't need full review bodies
        .sort(sortBy)
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("Product search error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/products/categories  -> distinct categories + brands, for filter UI
router.get("/categories", async (req, res) => {
  const categories = await Product.distinct("category", { isActive: true });
  const brands = await Product.distinct("brand", { isActive: true, brand: { $ne: "" } });
  res.json({ categories, brands });
});

// GET /api/products/:slug
router.get("/:slug", async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true });
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json({ product });
});

// POST /api/products/:slug/reviews
router.post("/:slug/reviews", requireAuth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || !comment) {
      return res.status(400).json({ error: "rating and comment are required" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating must be between 1 and 5" });
    }

    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ error: "Product not found" });

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.userId
    );
    if (alreadyReviewed) {
      return res.status(409).json({ error: "You have already reviewed this product" });
    }

    product.reviews.push({
      user: req.userId,
      name: req.user.name,
      rating: Number(rating),
      comment: comment.trim(),
    });
    product.recalculateRating();
    await product.save();

    res.status(201).json({ reviews: product.reviews, ratingAverage: product.ratingAverage });
  } catch (err) {
    console.error("Add review error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
