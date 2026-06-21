import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCart, updateCartItem, removeCartItem } from "../features/cart/cartSlice.js";
import { formatPrice } from "../utils/format.js";

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, status } = useSelector((s) => s.cart);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const subtotal = items.reduce((sum, i) => {
    const price = i.product?.discountPrice || i.product?.price || i.priceAtAdd;
    return sum + price * i.quantity;
  }, 0);

  if (status === "loading") {
    return <p className="text-gray-400 text-center py-20">Loading cart...</p>;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">Your cart is empty.</p>
        <Link to="/products" className="text-brand-600 hover:underline">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <h1 className="text-xl font-semibold">Your Cart</h1>
        {items.map((item) => {
          const product = item.product;
          if (!product) return null;
          const price = product.discountPrice || product.price;
          const outOfStock = !product.isActive || product.stock === 0;

          return (
            <div
              key={product._id}
              className="flex gap-4 bg-white border border-gray-200 rounded-xl p-4"
            >
              <Link to={`/products/${product.slug}`} className="shrink-0">
                <img
                  src={product.images?.[0] || "https://placehold.co/100x100"}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/products/${product.slug}`}
                  className="font-medium text-gray-800 hover:text-brand-600 line-clamp-1"
                >
                  {product.name}
                </Link>
                <p className="text-sm text-gray-500 mt-1">{formatPrice(price)} each</p>
                {outOfStock && <p className="text-sm text-red-600 mt-1">No longer available</p>}
                {!outOfStock && product.stock < item.quantity && (
                  <p className="text-sm text-amber-600 mt-1">
                    Only {product.stock} left — quantity will be adjusted at checkout
                  </p>
                )}

                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() =>
                        dispatch(
                          updateCartItem({
                            productId: product._id,
                            quantity: Math.max(1, item.quantity - 1),
                          })
                        )
                      }
                      className="px-2.5 py-1 text-gray-600 hover:bg-gray-50"
                    >
                      −
                    </button>
                    <span className="px-3 text-sm">{item.quantity}</span>
                    <button
                      onClick={() =>
                        dispatch(updateCartItem({ productId: product._id, quantity: item.quantity + 1 }))
                      }
                      disabled={outOfStock}
                      className="px-2.5 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => dispatch(removeCartItem(product._id))}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="text-right font-medium text-gray-800 shrink-0">
                {formatPrice(price * item.quantity)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 h-fit">
        <h2 className="font-semibold mb-4">Order Summary</h2>
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <p className="text-xs text-gray-400 mb-4">Coupon and shipping applied at checkout</p>
        <button
          onClick={() => navigate("/checkout")}
          className="w-full bg-gray-900 text-white rounded-lg py-2.5 font-medium hover:bg-gray-700 transition"
        >
          Proceed to checkout
        </button>
      </div>
    </div>
  );
}
