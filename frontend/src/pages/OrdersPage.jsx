import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders } from "../features/orders/ordersSlice.js";
import { formatPrice, formatDate, ORDER_STATUS_COLORS } from "../utils/format.js";

export default function OrdersPage() {
  const dispatch = useDispatch();
  const { items, status } = useSelector((s) => s.orders);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  if (status === "loading") {
    return <p className="text-gray-400 text-center py-20">Loading orders...</p>;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">You haven't placed any orders yet.</p>
        <Link to="/products" className="text-brand-600 hover:underline">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Order History</h1>
      <div className="space-y-3">
        {items.map((order) => (
          <Link
            key={order._id}
            to={`/orders/${order._id}`}
            className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-sm text-gray-400">Order #{order._id.slice(-8)}</p>
                <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                  ORDER_STATUS_COLORS[order.orderStatus] || "bg-gray-100 text-gray-600"
                }`}
              >
                {order.orderStatus}
              </span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-sm text-gray-600">
                {order.items.length} item{order.items.length !== 1 ? "s" : ""}
              </p>
              <p className="font-semibold text-gray-900">{formatPrice(order.totalAmount)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
