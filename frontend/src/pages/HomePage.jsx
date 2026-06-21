import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts, fetchCategories } from "../features/products/productsSlice.js";
import ProductCard from "../components/ProductCard.jsx";

export default function HomePage() {
  const dispatch = useDispatch();
  const { items, listStatus, categories } = useSelector((s) => s.products);

  useEffect(() => {
    dispatch(fetchProducts({ sort: "newest", limit: 8 }));
    dispatch(fetchCategories());
  }, [dispatch]);

  return (
    <div className="space-y-10">
      <section className="bg-gray-900 rounded-2xl px-8 py-14 text-center text-white">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Everything you need, delivered.</h1>
        <p className="text-gray-300 mb-6">Quality products, fair prices, fast shipping.</p>
        <Link
          to="/products"
          className="inline-block bg-brand-600 hover:bg-brand-700 transition text-white px-6 py-3 rounded-full font-medium"
        >
          Shop now
        </Link>
      </section>

      {categories.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Shop by category</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c}
                to={`/products?category=${encodeURIComponent(c)}`}
                className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm hover:border-brand-500 hover:text-brand-600 transition"
              >
                {c}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">New arrivals</h2>
          <Link to="/products" className="text-sm text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        {listStatus === "loading" && <p className="text-gray-400">Loading products...</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
