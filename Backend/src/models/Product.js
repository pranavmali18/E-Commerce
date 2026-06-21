import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true }, // denormalized for fast display
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 }, // optional sale price
    category: { type: String, required: true, index: true },
    brand: { type: String, default: "" },
    images: [{ type: String }], // URLs
    stock: { type: Number, required: true, default: 0, min: 0 },
    sku: { type: String, unique: true, sparse: true },
    isActive: { type: Boolean, default: true },

    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    reviews: [reviewSchema],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Text index for search across name/description/brand/category
productSchema.index({ name: "text", description: "text", brand: "text", category: "text" });
productSchema.index({ price: 1 });
productSchema.index({ category: 1, price: 1 });

productSchema.methods.recalculateRating = function () {
  if (this.reviews.length === 0) {
    this.ratingAverage = 0;
    this.ratingCount = 0;
    return;
  }
  const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
  this.ratingAverage = Math.round((sum / this.reviews.length) * 10) / 10;
  this.ratingCount = this.reviews.length;
};

export default mongoose.model("Product", productSchema);
