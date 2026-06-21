import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProduct, submitReview, clearCurrentProduct } from "../features/products/productsSlice.js";
import { addToCart } from "../features/cart/cartSlice.js";
import { addToWishlist, removeFromWishlist } from "../features/wishlist/wishlistSlice.js";
import StarRating from "../components/StarRating.jsx";
import { formatPrice, formatDate } from "../utils/format.js";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { current: product, detailStatus, reviewStatus, error } = useSelector((s) => s.products);
  const { user } = useSelector((s) => s.auth);
  const wishlistItems = useSelector((s) => s.wishlist.items);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    dispatch(fetchProduct(slug));
    return () => dispatch(clearCurrentProduct());
  }, [dispatch, slug]);

  useEffect(() => {
    setActiveImage(0);
    setQuantity(1);
  }, [slug]);

  if (detailStatus === "loading" || !product) {
    return <p className="text-gray-400 text-center py-20">Loading...</p>;
  }
  if (detailStatus === "failed") {
    return <p className="text-red-600 text-center py-20">{error || "Product not found"}</p>;
  }

  const price = product.discountPrice || product.price;
  const hasDiscount = !!product.discountPrice;
  const isWishlisted = wishlistItems.some((p) => p._id === product._id);
  const alreadyReviewed =
    user && product.reviews?.some((r) => r.user === user.id || r.user?._id === user.id);

  function handleAddToCart() {
    if (!user) return (window.location.href = "/login");
    dispatch(addToCart({ productId: product._id, quantity }));
  }

  function handleToggleWishlist() {
    if (!user) return (window.location.href = "/login");
    if (isWishlisted) dispatch(removeFromWishlist(product._id));
    else dispatch(addToWishlist(product._id));
  }

  async function handleReviewSubmit(e) {
    e.preventDefault();
    setReviewError("");
    if (!reviewForm.comment.trim()) {
      setReviewError("Please write a comment");
      return;
    }
    const result = await dispatch(submitReview({ slug, ...reviewForm }));
    if (submitReview.fulfilled.match(result)) {
      setReviewForm({ rating: 5, comment: "" });
    } else {
      setReviewError(result.payload || "Failed to submit review");
    }
  }

  return (
    <div className="space-y-12">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3">
            <img
              src={product.images?.[activeImage] || "https://placehold.co/600x600?text=No+Image"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    i === activeImage ? "border-brand-500" : "border-transparent"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-xs text-gray-400 uppercase">{product.category}</p>
          <h1 className="text-2xl font-semibold text-gray-900 mt-1">{product.name}</h1>
          <div className="mt-2">
            <StarRating rating={product.ratingAverage} count={product.ratingCount} size="text-base" />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-900">{formatPrice(price)}</span>
            {hasDiscount && (
              <span className="text-lg text-gray-400 line-through">{formatPrice(product.price)}</span>
            )}
          </div>

          <p className="text-gray-600 mt-4 leading-relaxed">{product.description}</p>

          <p className="mt-4 text-sm">
            {product.stock > 0 ? (
              <span className="text-green-600">
                In stock {product.stock <= 5 && `(only ${product.stock} left)`}
              </span>
            ) : (
              <span className="text-red-600">Out of stock</span>
            )}
          </p>

          <div className="flex items-center gap-3 mt-6">
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 py-2 text-gray-600 hover:bg-gray-50"
              >
                −
              </button>
              <span className="px-4">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                className="px-3 py-2 text-gray-600 hover:bg-gray-50"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 bg-gray-900 text-white rounded-lg py-2.5 font-medium hover:bg-gray-700 disabled:opacity-40 transition"
            >
              {product.stock === 0 ? "Out of stock" : "Add to cart"}
            </button>
            <button
              onClick={handleToggleWishlist}
              className="w-11 h-11 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
              aria-label="Toggle wishlist"
            >
              <span className={isWishlisted ? "text-red-500" : "text-gray-400"}>
                {isWishlisted ? "♥" : "♡"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Reviews {product.ratingCount > 0 && `(${product.ratingCount})`}
        </h2>

        {user && !alreadyReviewed && (
          <form
            onSubmit={handleReviewSubmit}
            className="bg-white border border-gray-200 rounded-xl p-4 mb-6 max-w-lg"
          >
            <p className="font-medium text-sm text-gray-700 mb-2">Write a review</p>
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReviewForm((f) => ({ ...f, rating: r }))}
                  className={`text-xl ${r <= reviewForm.rating ? "text-yellow-400" : "text-gray-300"}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder="Share your thoughts about this product..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {reviewError && <p className="text-sm text-red-600 mt-1">{reviewError}</p>}
            <button
              type="submit"
              disabled={reviewStatus === "loading"}
              className="mt-2 bg-gray-900 text-white text-sm rounded-lg px-4 py-2 hover:bg-gray-700 disabled:opacity-50"
            >
              {reviewStatus === "loading" ? "Submitting..." : "Submit review"}
            </button>
          </form>
        )}

        {alreadyReviewed && (
          <p className="text-sm text-gray-500 mb-6">You've already reviewed this product. Thanks!</p>
        )}

        {!user && (
          <p className="text-sm text-gray-500 mb-6">
            <a href="/login" className="text-brand-600 hover:underline">
              Log in
            </a>{" "}
            to write a review.
          </p>
        )}

        <div className="space-y-4">
          {product.reviews?.length === 0 && (
            <p className="text-sm text-gray-400">No reviews yet. Be the first!</p>
          )}
          {[...(product.reviews || [])]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((r, i) => (
              <div key={i} className="border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm text-gray-800">{r.name}</p>
                  <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                </div>
                <StarRating rating={r.rating} />
                <p className="text-sm text-gray-600 mt-1">{r.comment}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
