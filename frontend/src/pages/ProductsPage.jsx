import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts, fetchCategories } from "../features/products/productsSlice.js";
import ProductCard from "../components/ProductCard.jsx";

export default function ProductsPage() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, pagination, listStatus, categories, brands } = useSelector((s) => s.products);

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const brand = searchParams.get("brand") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const rating = searchParams.get("rating") || "";
  const sort = searchParams.get("sort") || "newest";
  const page = Number(searchParams.get("page")) || 1;

  const [priceDraft, setPriceDraft] = useState({ min: minPrice, max: maxPrice });

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchProducts({ search, category, brand, minPrice, maxPrice, rating, sort, page, limit: 12 })
    );
  }, [dispatch, search, category, brand, minPrice, maxPrice, rating, sort, page]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page"); // reset pagination on filter change
    setSearchParams(next);
  }

  function applyPriceFilter(e) {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (priceDraft.min) next.set("minPrice", priceDraft.min);
    else next.delete("minPrice");
    if (priceDraft.max) next.set("maxPrice", priceDraft.max);
    else next.delete("maxPrice");
    next.delete("page");
    setSearchParams(next);
  }

  function goToPage(p) {
    const next = new URLSearchParams(searchParams);
    next.set("page", p);
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearFilters() {
    setSearchParams({});
    setPriceDraft({ min: "", max: "" });
  }

  const hasFilters = category || brand || minPrice || maxPrice || rating;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Filters sidebar */}
      <aside className="lg:w-64 shrink-0 space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-800">Filters</h3>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-brand-600 hover:underline">
                Clear all
              </button>
            )}
          </div>

          <div className="mb-4">
            <p className="text-sm font-medium text-gray-600 mb-2">Category</p>
            <div className="space-y-1">
              {categories.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="radio"
                    name="category"
                    checked={category === c}
                    onChange={() => updateParam("category", c)}
                  />
                  {c}
                </label>
              ))}
            </div>
          </div>

          {brands.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-600 mb-2">Brand</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {brands.map((b) => (
                  <label key={b} className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="radio"
                      name="brand"
                      checked={brand === b}
                      onChange={() => updateParam("brand", b)}
                    />
                    {b}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm font-medium text-gray-600 mb-2">Price range</p>
            <form onSubmit={applyPriceFilter} className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={priceDraft.min}
                onChange={(e) => setPriceDraft((d) => ({ ...d, min: e.target.value }))}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                placeholder="Max"
                value={priceDraft.max}
                onChange={(e) => setPriceDraft((d) => ({ ...d, max: e.target.value }))}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </form>
            <button
              onClick={applyPriceFilter}
              className="mt-2 text-sm text-brand-600 hover:underline"
            >
              Apply
            </button>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Minimum rating</p>
            <div className="space-y-1">
              {[4, 3, 2, 1].map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="radio"
                    name="rating"
                    checked={rating === String(r)}
                    onChange={() => updateParam("rating", String(r))}
                  />
                  {r}★ & up
                </label>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Results */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {pagination.total} result{pagination.total !== 1 ? "s" : ""}
            {search && <> for "{search}"</>}
          </p>
          <select
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="priceLow">Price: Low to High</option>
            <option value="priceHigh">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>

        {listStatus === "loading" && <p className="text-gray-400 text-center py-10">Loading...</p>}
        {listStatus === "succeeded" && items.length === 0 && (
          <p className="text-gray-400 text-center py-10">No products match your filters.</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => goToPage(page + 1)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
