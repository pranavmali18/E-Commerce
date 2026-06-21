import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  adminFetchDashboardSummary,
  adminFetchRevenueTrend,
  adminFetchTopProducts,
} from "../../features/admin/adminSlice.js";
import { formatPrice } from "../../utils/format.js";

export default function AdminDashboardPage() {
  const dispatch = useDispatch();
  const { summary, revenueTrend, topProducts } = useSelector((s) => s.admin);

  useEffect(() => {
    dispatch(adminFetchDashboardSummary());
    dispatch(adminFetchRevenueTrend(30));
    dispatch(adminFetchTopProducts());
  }, [dispatch]);

  const maxRevenue = Math.max(...revenueTrend.map((t) => t.revenue), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Sales Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={summary ? formatPrice(summary.totalRevenue) : "—"} />
        <StatCard label="Paid Orders" value={summary?.totalPaidOrders ?? "—"} />
        <StatCard label="Customers" value={summary?.totalUsers ?? "—"} />
        <StatCard
          label="Low Stock Items"
          value={summary?.lowStockCount ?? "—"}
          highlight={summary?.lowStockCount > 0}
        />
      </div>

      {summary?.statusBreakdown && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold mb-3">Orders by Status</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(summary.statusBreakdown).map(([status, count]) => (
              <div key={status} className="bg-gray-50 rounded-lg px-4 py-2 text-sm">
                <span className="capitalize text-gray-600">{status}</span>:{" "}
                <span className="font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold mb-4">Revenue — Last 30 Days</h2>
        {revenueTrend.length === 0 ? (
          <p className="text-sm text-gray-400">No revenue data yet.</p>
        ) : (
          <div className="flex items-end gap-1 h-40">
            {revenueTrend.map((t) => (
              <div key={t.date} className="flex-1 flex flex-col items-center justify-end group relative">
                <div
                  className="w-full bg-brand-500 rounded-t hover:bg-brand-600 transition"
                  style={{ height: `${Math.max((t.revenue / maxRevenue) * 100, 2)}%` }}
                />
                <div className="absolute -top-8 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {t.date}: {formatPrice(t.revenue)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold mb-4">Top Products</h2>
        {topProducts.length === 0 ? (
          <p className="text-sm text-gray-400">No sales data yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100">
                <th className="pb-2 font-medium">Product</th>
                <th className="pb-2 font-medium text-right">Units Sold</th>
                <th className="pb-2 font-medium text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p) => (
                <tr key={p._id} className="border-b border-gray-50">
                  <td className="py-2 text-gray-800">{p.name}</td>
                  <td className="py-2 text-right text-gray-600">{p.unitsSold}</td>
                  <td className="py-2 text-right font-medium text-gray-900">
                    {formatPrice(p.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }) {
  return (
    <div
      className={`bg-white border rounded-xl p-4 ${
        highlight ? "border-amber-300 bg-amber-50" : "border-gray-200"
      }`}
    >
      <p className="text-xs text-gray-400 uppercase">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
