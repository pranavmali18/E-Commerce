import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { adminFetchOrders, adminUpdateOrderStatus } from "../../features/admin/adminSlice.js";
import { formatPrice, formatDate, ORDER_STATUS_COLORS } from "../../utils/format.js";

const STATUS_OPTIONS = ["placed", "processing", "shipped", "delivered", "cancelled"];
const NEXT_STATUS = {
  placed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export default function AdminOrdersPage() {
  const dispatch = useDispatch();
  const { orders, error } = useSelector((s) => s.admin);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    dispatch(adminFetchOrders({ status: statusFilter || undefined }));
  }, [dispatch, statusFilter]);

  function handleStatusChange(orderId, status) {
    dispatch(adminUpdateOrderStatus({ id: orderId, status }));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Orders</h1>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
      >
        <option value="">All statuses</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s} className="capitalize">
            {s}
          </option>
        ))}
      </select>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="p-3 font-medium">Order</th>
              <th className="p-3 font-medium">Customer</th>
              <th className="p-3 font-medium">Date</th>
              <th className="p-3 font-medium text-right">Total</th>
              <th className="p-3 font-medium">Payment</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Update</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const nextOptions = NEXT_STATUS[order.orderStatus] || [];
              return (
                <tr key={order._id} className="border-b border-gray-50">
                  <td className="p-3 text-gray-600">#{order._id.slice(-8)}</td>
                  <td className="p-3 text-gray-800">
                    {order.user?.name}
                    <br />
                    <span className="text-gray-400 text-xs">{order.user?.email}</span>
                  </td>
                  <td className="p-3 text-gray-600">{formatDate(order.createdAt)}</td>
                  <td className="p-3 text-right text-gray-800">{formatPrice(order.totalAmount)}</td>
                  <td className="p-3 capitalize text-gray-600">{order.paymentStatus}</td>
                  <td className="p-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                        ORDER_STATUS_COLORS[order.orderStatus] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {order.orderStatus}
                    </span>
                  </td>
                  <td className="p-3">
                    {nextOptions.length > 0 ? (
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) handleStatusChange(order._id, e.target.value);
                          e.target.value = "";
                        }}
                        className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
                      >
                        <option value="">Move to...</option>
                        {nextOptions.map((s) => (
                          <option key={s} value={s} className="capitalize">
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-400">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
