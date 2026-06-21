import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import StarRating from "./StarRating.jsx";
import { formatPrice } from "../utils/format.js";
import { addToCart } from "../features/cart/cartSlice.js";
import { addToWishlist, removeFromWishlist } from "../features/wishlist/wishlistSlice.js";

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const wishlistItems = useSelector((s) => s.wishlist.items);
  const isWishlisted = wishlistItems.some((p) => p._id === product._id);

  const price = product.discountPrice || product.price;
  const hasDiscount = !!product.discountPrice;

  function handleAddToCart(e) {
    e.preventDefault();
    if (!user) return (window.location.href = "/login");
    dispatch(addToCart({ productId: product._id, quantity: 1 }));
  }

  function handleToggleWishlist(e) {
    e.preventDefault();
    if (!user) return (window.location.href = "/login");
    if (isWishlisted) dispatch(removeFromWishlist(product._id));
    else dispatch(addToWishlist(product._id));
  }

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition flex flex-col"
    >
      <div className="relative aspect-square bg-gray-100">
        <img
          src={product.images?.[0] || "https://placehold.co/400x400?text=No+Image"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition"
        />
        <button
          onClick={handleToggleWishlist}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow hover:scale-110 transition"
          aria-label="Toggle wishlist"
        >
          <span className={isWishlisted ? "text-red-500" : "text-gray-400"}>
            {isWishlisted ? "♥" : "♡"}
          </span>
        </button>
        {product.stock === 0 && (
          <span className="absolute bottom-2 left-2 bg-gray-900 text-white text-xs px-2 py-1 rounded">
            Out of stock
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-gray-400 uppercase">{product.category}</p>
        <h3 className="font-medium text-gray-800 line-clamp-2 mt-0.5">{product.name}</h3>
        <div className="mt-1">
          <StarRating rating={product.ratingAverage} count={product.ratingCount} />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="font-semibold text-gray-900">{formatPrice(price)}</span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">{formatPrice(product.price)}</span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="mt-3 w-full bg-gray-900 text-white text-sm rounded-lg py-2 font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {product.stock === 0 ? "Out of stock" : "Add to cart"}
        </button>
      </div>
    </Link>
  );
}
