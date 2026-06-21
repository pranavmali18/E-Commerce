import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  adminFetchProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
} from "../../features/admin/adminSlice.js";
import { formatPrice } from "../../utils/format.js";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  discountPrice: "",
  category: "",
  brand: "",
  images: "",
  stock: "",
  sku: "",
};

export default function AdminProductsPage() {
  const dispatch = useDispatch();
  const { products, error } = useSelector((s) => s.admin);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    dispatch(adminFetchProducts({ search }));
  }, [dispatch, search]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
  }

  function openEdit(p) {
    setEditingId(p._id);
    setForm({
      name: p.name,
      description: p.description,
      price: p.price,
      discountPrice: p.discountPrice || "",
      category: p.category,
      brand: p.brand || "",
      images: (p.images || []).join(", "),
      stock: p.stock,
      sku: p.sku || "",
    });
    setFormError("");
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
      category: form.category,
      brand: form.brand,
      images: form.images
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      stock: Number(form.stock),
      sku: form.sku || undefined,
    };

    const result = editingId
      ? await dispatch(adminUpdateProduct({ id: editingId, updates: payload }))
      : await dispatch(adminCreateProduct(payload));

    setSubmitting(false);

    if (result.meta.requestStatus === "fulfilled") {
      setShowForm(false);
    } else {
      setFormError(result.payload || "Failed to save product");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Deactivate this product? It will be hidden from the store.")) return;
    dispatch(adminDeleteProduct(id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold">Products</h1>
        <button
          onClick={openCreate}
          className="bg-gray-900 text-white text-sm rounded-lg px-4 py-2 hover:bg-gray-700"
        >
          + Add Product
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search products..."
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full max-w-sm"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="p-3 font-medium">Product</th>
              <th className="p-3 font-medium">Category</th>
              <th className="p-3 font-medium text-right">Price</th>
              <th className="p-3 font-medium text-right">Stock</th>
              <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} className="border-b border-gray-50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={p.images?.[0] || "https://placehold.co/40x40"}
                      alt=""
                      className="w-9 h-9 rounded object-cover"
                    />
                    <span className="text-gray-800 line-clamp-1">{p.name}</span>
                  </div>
                </td>
                <td className="p-3 text-gray-600">{p.category}</td>
                <td className="p-3 text-right text-gray-800">
                  {formatPrice(p.discountPrice || p.price)}
                </td>
                <td className="p-3 text-right">
                  <span className={p.stock <= 5 ? "text-amber-600 font-medium" : "text-gray-600"}>
                    {p.stock}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => openEdit(p)} className="text-brand-600 hover:underline">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(p._id)} className="text-red-600 hover:underline">
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-400">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="font-semibold text-lg mb-4">
              {editingId ? "Edit Product" : "Add Product"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <textarea
                required
                placeholder="Description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  type="number"
                  placeholder="Price"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Discount price (optional)"
                  value={form.discountPrice}
                  onChange={(e) => setForm((f) => ({ ...f, discountPrice: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  required
                  placeholder="Category"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  placeholder="Brand"
                  value={form.brand}
                  onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  required
                  type="number"
                  placeholder="Stock"
                  value={form.stock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  placeholder="SKU (optional)"
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <input
                placeholder="Image URLs, comma-separated"
                value={form.images}
                onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gray-900 text-white text-sm rounded-lg px-4 py-2 hover:bg-gray-700 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save"}
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
