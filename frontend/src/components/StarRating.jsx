export default function StarRating({ rating = 0, count, size = "text-sm" }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className={`flex items-center gap-1 ${size}`}>
      <div className="flex text-yellow-400">
        {stars.map((s) => (
          <span key={s}>{s <= Math.round(rating) ? "★" : "☆"}</span>
        ))}
      </div>
      {count != null && <span className="text-gray-400">({count})</span>}
    </div>
  );
}
