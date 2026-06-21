import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchWishlist } from "../features/wishlist/wishlistSlice.js";
import ProductCard from "../components/ProductCard.jsx";

export default function WishlistPage() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((s) => s.wishlist);

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Your Wishlist</h1>
      {status === "loading" && <p className="text-gray-400">Loading...</p>}
      {status === "succeeded" && items.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">Your wishlist is empty.</p>
          <Link to="/products" className="text-brand-600 hover:underline">
            Browse products
          </Link>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </div>
  );
}
