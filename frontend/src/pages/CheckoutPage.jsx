import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCart } from "../features/cart/cartSlice.js";
import { addAddress } from "../features/auth/authSlice.js";
import { setAppliedCoupon, clearAppliedCoupon } from "../features/ui/uiSlice.js";
import api from "../utils/api.js";
import { formatPrice } from "../utils/format.js";

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { items } = useSelector((s) => s.cart);
  const appliedCoupon = useSelector((s) => s.ui.appliedCoupon);

  const [selectedAddressId, setSelectedAddressId] = useState(
    user?.addresses?.find((a) => a.isDefault)?._id || user?.addresses?.[0]?._id || ""
  );
  const [showAddressForm, setShowAddressForm] = useState(!user?.addresses?.length);
  const [addressForm, setAddressForm] = useState({
    label: "Home",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    phone: "",
  });

  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");

  useEffect(() => {
    dispatch(fetchCart());
    return () => dispatch(clearAppliedCoupon());
  }, [dispatch]);

  const subtotal = items.reduce((sum, i) => {
    const price = i.product?.discountPrice || i.product?.price || i.priceAtAdd;
    return sum + price * i.quantity;
  }, 0);
  const discount = appliedCoupon?.discountAmount || 0;
  const total = Math.max(subtotal - discount, 0);

  async function handleAddAddress(e) {
    e.preventDefault();
    const result = await dispatch(addAddress(addressForm));
    if (addAddress.fulfilled.match(result)) {
      const newAddr = result.payload[result.payload.length - 1];
      setSelectedAddressId(newAddr._id);
      setShowAddressForm(false);
    }
  }

  async function handleApplyCoupon(e) {
    e.preventDefault();
    setCouponError("");
    setCouponLoading(true);
    try {
      const { data } = await api.post("/coupons/validate", {
        code: couponCode,
        orderAmount: subtotal,
      });
      dispatch(setAppliedCoupon(data));
    } catch (err) {
      setCouponError(err.response?.data?.error || "Invalid coupon");
      dispatch(clearAppliedCoupon());
    } finally {
      setCouponLoading(false);
    }
  }

  async function handlePlaceOrder() {
    if (!selectedAddressId) {
      setPlaceError("Please select or add a shipping address");
      return;
    }
    setPlaceError("");
    setPlacing(true);

    try {
      // Step 1: create order + Razorpay order on the server
      const { data: checkoutData } = await api.post("/orders/checkout/razorpay", {
        addressId: selectedAddressId,
        couponCode: appliedCoupon?.code,
      });

      if (typeof window.Razorpay === "undefined") {
        setPlaceError(
          "Payment widget failed to load. Check your internet connection and that the Razorpay script tag is present in index.html."
        );
        setPlacing(false);
        return;
      }

      // Step 2: open Razorpay checkout widget
      const rzp = new window.Razorpay({
        key: checkoutData.keyId,
        amount: checkoutData.amount,
        currency: checkoutData.currency,
        name: "MyShop",
        description: "Order payment",
        order_id: checkoutData.razorpayOrderId,
        prefill: { name: user.name, email: user.email },
        handler: async function (response) {
          try {
            const { data: verifyData } = await api.post("/orders/checkout/razorpay/verify", {
              orderId: checkoutData.orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            navigate(`/orders/${verifyData.order._id}`, { replace: true });
          } catch (err) {
            setPlaceError(err.response?.data?.error || "Payment verification failed");
          } finally {
            setPlacing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPlacing(false);
          },
        },
        theme: { color: "#e65c05" },
      });

      rzp.on("payment.failed", function () {
        setPlaceError("Payment failed. Please try again.");
        setPlacing(false);
      });

      rzp.open();
    } catch (err) {
      setPlaceError(err.response?.data?.error || "Failed to start checkout");
      setPlacing(false);
    }
  }

  if (items.length === 0) {
    return <p className="text-gray-400 text-center py-20">Your cart is empty.</p>;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        {/* Address */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold mb-3">Shipping Address</h2>

          {user?.addresses?.length > 0 && !showAddressForm && (
            <div className="space-y-2 mb-3">
              {user.addresses.map((addr) => (
                <label
                  key={addr._id}
                  className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer ${
                    selectedAddressId === addr._id ? "border-brand-500 bg-brand-50" : "border-gray-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddressId === addr._id}
                    onChange={() => setSelectedAddressId(addr._id)}
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <p className="font-medium text-gray-800">{addr.label}</p>
                    <p className="text-gray-600">
                      {addr.line1}, {addr.line2 ? `${addr.line2}, ` : ""}
                      {addr.city}, {addr.state} {addr.postalCode}
                    </p>
                    <p className="text-gray-500">{addr.phone}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {!showAddressForm && (
            <button
              onClick={() => setShowAddressForm(true)}
              className="text-sm text-brand-600 hover:underline"
            >
              + Add new address
            </button>
          )}

          {showAddressForm && (
            <form onSubmit={handleAddAddress} className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Label (e.g. Home)"
                  value={addressForm.label}
                  onChange={(e) => setAddressForm((f) => ({ ...f, label: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2"
                />
                <input
                  required
                  placeholder="Address line 1"
                  value={addressForm.line1}
                  onChange={(e) => setAddressForm((f) => ({ ...f, line1: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2"
                />
                <input
                  placeholder="Address line 2 (optional)"
                  value={addressForm.line2}
                  onChange={(e) => setAddressForm((f) => ({ ...f, line2: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2"
                />
                <input
                  required
                  placeholder="City"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  required
                  placeholder="State"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm((f) => ({ ...f, state: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  required
                  placeholder="Postal code"
                  value={addressForm.postalCode}
                  onChange={(e) => setAddressForm((f) => ({ ...f, postalCode: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  required
                  placeholder="Phone"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm((f) => ({ ...f, phone: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-gray-900 text-white text-sm rounded-lg px-4 py-2 hover:bg-gray-700"
                >
                  Save address
                </button>
                {user?.addresses?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="text-sm text-gray-500 hover:underline"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Coupon */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold mb-3">Coupon</h2>
          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <p className="text-sm text-green-700">
                <strong>{appliedCoupon.code}</strong> applied — saved{" "}
                {formatPrice(appliedCoupon.discountAmount)}
              </p>
              <button
                onClick={() => dispatch(clearAppliedCoupon())}
                className="text-sm text-green-700 hover:underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase"
              />
              <button
                type="submit"
                disabled={couponLoading || !couponCode.trim()}
                className="bg-gray-900 text-white text-sm rounded-lg px-4 py-2 hover:bg-gray-700 disabled:opacity-50"
              >
                {couponLoading ? "Checking..." : "Apply"}
              </button>
            </form>
          )}
          {couponError && <p className="text-sm text-red-600 mt-2">{couponError}</p>}
        </div>
      </div>

      {/* Order summary */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 h-fit">
        <h2 className="font-semibold mb-4">Order Summary</h2>
        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {items.map((i) => (
            <div key={i.product._id} className="flex justify-between text-sm text-gray-600">
              <span className="truncate pr-2">
                {i.product.name} × {i.quantity}
              </span>
              <span className="shrink-0">
                {formatPrice((i.product.discountPrice || i.product.price) * i.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-3 space-y-1">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>−{formatPrice(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-600">
            <span>Shipping</span>
            <span>Free</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-100 mt-2">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        {placeError && <p className="text-sm text-red-600 mt-3">{placeError}</p>}

        <button
          onClick={handlePlaceOrder}
          disabled={placing || !selectedAddressId}
          className="w-full bg-brand-600 text-white rounded-lg py-2.5 font-medium hover:bg-brand-700 disabled:opacity-50 transition mt-4"
        >
          {placing ? "Processing..." : `Pay ${formatPrice(total)}`}
        </button>
      </div>
    </div>
  );
}
