import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice.js";
import { resetCartState } from "../features/cart/cartSlice.js";
import { resetWishlistState } from "../features/wishlist/wishlistSlice.js";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const cartCount = useSelector((s) => s.cart.items.reduce((sum, i) => sum + i.quantity, 0));
  const wishlistCount = useSelector((s) => s.wishlist.items.length);
  const [search, setSearch] = useState("");

  function handleSearch(e) {
    e.preventDefault();
    navigate(search.trim() ? `/products?search=${encodeURIComponent(search.trim())}` : "/products");
  }

  function handleLogout() {
    dispatch(logout());
    dispatch(resetCartState());
    dispatch(resetWishlistState());
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link to="/" className="text-xl font-bold text-brand-600 shrink-0">
          MyShop
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </form>

        <nav className="flex items-center gap-4 text-sm shrink-0">
          <Link to="/products" className="text-gray-600 hover:text-gray-900 hidden sm:inline">
            Shop
          </Link>

          {user && (
            <Link to="/wishlist" className="relative text-gray-600 hover:text-gray-900">
              ♡ Wishlist
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-brand-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
          )}

          <Link to="/cart" className="relative text-gray-600 hover:text-gray-900">
            🛒 Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-brand-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              {user.role === "admin" && (
                <Link to="/admin" className="text-brand-600 font-medium hover:underline">
                  Admin
                </Link>
              )}
              <Link to="/orders" className="text-gray-600 hover:text-gray-900">
                Orders
              </Link>
              <span className="text-gray-300">|</span>
              <span className="text-gray-600 hidden md:inline">
                Hi, {user.name ? user.name.split(" ")[0] : "there"}
              </span>
              <button onClick={handleLogout} className="text-red-600 hover:underline">
                Log out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-gray-900 text-white px-4 py-1.5 rounded-full hover:bg-gray-700 transition"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
