import "dotenv/config";
import bcrypt from "bcryptjs";
import slugify from "slugify";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import mongoose from "mongoose";

const sampleProducts = [
  {
    name: "Wireless Bluetooth Headphones",
    description: "Over-ear headphones with active noise cancellation and 30-hour battery life.",
    price: 2999,
    discountPrice: 2499,
    category: "Electronics",
    brand: "SoundCore",
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600"],
    stock: 25,
  },
  {
    name: "Smart Fitness Watch",
    description: "Track heart rate, sleep, and workouts with a 7-day battery and AMOLED display.",
    price: 4999,
    category: "Electronics",
    brand: "FitTrack",
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"],
    stock: 15,
  },
  {
    name: "Men's Cotton T-Shirt",
    description: "Breathable 100% cotton t-shirt, regular fit, available in multiple colors.",
    price: 599,
    category: "Clothing",
    brand: "UrbanFit",
    images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600"],
    stock: 100,
  },
  {
    name: "Stainless Steel Water Bottle",
    description: "Double-wall vacuum insulated, keeps drinks cold for 24 hours / hot for 12.",
    price: 799,
    category: "Home & Kitchen",
    brand: "HydroLife",
    images: ["https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600"],
    stock: 3, // intentionally low to demo low-stock dashboard widget
  },
  {
    name: "Ergonomic Office Chair",
    description: "Adjustable lumbar support, breathable mesh back, and a 5-year warranty.",
    price: 8999,
    discountPrice: 7499,
    category: "Furniture",
    brand: "ComfortPlus",
    images: ["https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600"],
    stock: 8,
  },
  {
    name: "Organic Green Tea (100 bags)",
    description: "Hand-picked organic green tea leaves, rich in antioxidants.",
    price: 349,
    category: "Grocery",
    brand: "LeafPure",
    images: ["https://images.unsplash.com/photo-1556881286-fc6915169721?w=600"],
    stock: 50,
  },
];

async function seed() {
  await connectDB();

  // --- Admin user ---
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@myshop.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123456";

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    admin = await User.create({
      name: "Admin",
      email: adminEmail,
      passwordHash,
      role: "admin",
    });
    await Cart.create({ user: admin._id, items: [] });
    console.log(`Created admin user: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  // --- Sample products ---
  for (const p of sampleProducts) {
    const slug = slugify(p.name, { lower: true, strict: true });
    const exists = await Product.findOne({ slug });
    if (exists) continue;
    await Product.create({ ...p, slug, createdBy: admin._id });
    console.log(`Created product: ${p.name}`);
  }

  console.log("Seed complete.");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
