import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrder, cancelOrder } from "../features/orders/ordersSlice.js";
import { formatPrice, formatDate, ORDER_STATUS_COLORS } from "../utils/format.js";

export default function OrderDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current: order, status } = useSelector((s) => s.orders);

  useEffect(() => {
    dispatch(fetchOrder(id));
  }, [dispatch, id]);

  if (status === "loading" || !order) {
    return <p className="text-gray-400 text-center py-20">Loading order...</p>;
  }

  const canCancel = ["placed", "processing"].includes(order.orderStatus);

  async function handleCancel() {
    if (!window.confirm("Cancel this order?")) return;
    dispatch(cancelOrder(order._id));
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link to="/orders" className="text-sm text-brand-600 hover:underline">
          ← Back to orders
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-sm text-gray-400">Order #{order._id.slice(-8)}</p>
            <p className="text-sm text-gray-600">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
              ORDER_STATUS_COLORS[order.orderStatus] || "bg-gray-100 text-gray-600"
            }`}
          >
            {order.orderStatus}
          </span>
        </div>

        <div className="mt-4 space-y-1">
          <p className="text-sm text-gray-500">
            Payment: <span className="capitalize text-gray-700">{order.paymentStatus}</span>
          </p>
        </div>

        {canCancel && (
          <button onClick={handleCancel} className="mt-3 text-sm text-red-600 hover:underline">
            Cancel order
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold mb-3">Items</h2>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex gap-3">
              <img
                src={item.image || "https://placehold.co/60x60"}
                alt={item.name}
                className="w-14 h-14 object-cover rounded-lg"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{item.name}</p>
                <p className="text-sm text-gray-500">
                  {formatPrice(item.price)} × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-medium text-gray-800">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 mt-4 pt-3 space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Items total</span>
            <span>{formatPrice(order.itemsTotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount {order.coupon?.code && `(${order.coupon.code})`}</span>
              <span>−{formatPrice(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-600">
            <span>Shipping</span>
            <span>{order.shippingFee > 0 ? formatPrice(order.shippingFee) : "Free"}</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-100 mt-2">
            <span>Total</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold mb-2">Shipping Address</h2>
        <p className="text-sm text-gray-600">
          {order.shippingAddress.line1}
          {order.shippingAddress.line2 && `, ${order.shippingAddress.line2}`}
          <br />
          {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
          {order.shippingAddress.postalCode}
          <br />
          {order.shippingAddress.country}
          <br />
          Phone: {order.shippingAddress.phone}
        </p>
      </div>
    </div>
  );
}
