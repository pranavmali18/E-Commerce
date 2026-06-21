import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { adminFetchCoupons, adminCreateCoupon, adminDeleteCoupon } from "../../features/admin/adminSlice.js";
import { formatPrice, formatDate } from "../../utils/format.js";

const emptyForm = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  minOrderAmount: "",
  maxDiscountAmount: "",
  expiresAt: "",
  usageLimit: "",
};

export default function AdminCouponsPage() {
  const dispatch = useDispatch();
  const { coupons, error } = useSelector((s) => s.admin);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    dispatch(adminFetchCoupons());
  }, [dispatch]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    const payload = {
      code: form.code,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
      expiresAt: form.expiresAt,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
    };

    const result = await dispatch(adminCreateCoupon(payload));
    setSubmitting(false);

    if (result.meta.requestStatus === "fulfilled") {
      setForm(emptyForm);
      setShowForm(false);
    } else {
      setFormError(result.payload || "Failed to create coupon");
    }
  }

  function handleDeactivate(id) {
    if (!window.confirm("Deactivate this coupon?")) return;
    dispatch(adminDeleteCoupon(id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold">Coupons</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-gray-900 text-white text-sm rounded-lg px-4 py-2 hover:bg-gray-700"
        >
          + Add Coupon
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="p-3 font-medium">Code</th>
              <th className="p-3 font-medium">Discount</th>
              <th className="p-3 font-medium">Min Order</th>
              <th className="p-3 font-medium">Expires</th>
              <th className="p-3 font-medium">Used</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c._id} className="border-b border-gray-50">
                <td className="p-3 font-mono text-gray-800">{c.code}</td>
                <td className="p-3 text-gray-600">
                  {c.discountType === "percentage" ? `${c.discountValue}%` : formatPrice(c.discountValue)}
                </td>
                <td className="p-3 text-gray-600">{formatPrice(c.minOrderAmount)}</td>
                <td className="p-3 text-gray-600">{formatDate(c.expiresAt)}</td>
                <td className="p-3 text-gray-600">
                  {c.usedCount}
                  {c.usageLimit != null ? ` / ${c.usageLimit}` : ""}
                </td>
                <td className="p-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      c.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-3 text-right">
                  {c.isActive && (
                    <button
                      onClick={() => handleDeactivate(c._id)}
                      className="text-red-600 hover:underline"
                    >
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-400">
                  No coupons yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="font-semibold text-lg mb-4">Add Coupon</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                placeholder="Code (e.g. SAVE20)"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.discountType}
                  onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="percentage">Percentage</option>
                  <option value="flat">Flat amount</option>
                </select>
                <input
                  required
                  type="number"
                  placeholder={form.discountType === "percentage" ? "e.g. 20" : "e.g. 100"}
                  value={form.discountValue}
                  onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Min order amount"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                {form.discountType === "percentage" && (
                  <input
                    type="number"
                    placeholder="Max discount cap"
                    value={form.maxDiscountAmount}
                    onChange={(e) => setForm((f) => ({ ...f, maxDiscountAmount: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                )}
                <input
                  required
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Usage limit (optional)"
                  value={form.usageLimit}
                  onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gray-900 text-white text-sm rounded-lg px-4 py-2 hover:bg-gray-700 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-sm text-gray-500 hover:underline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
