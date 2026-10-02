
import { useState } from "react";
import { ArrowLeft, CheckCircle2, LoaderCircle, X } from "lucide-react";
import { createOrder } from "../services/orderService";
import { useAuth } from "../context/AuthContext";

const initialAddress = {
  name: "",
  addressLine1: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount ?? 0);

export default function CheckoutModal({
  items,
  products,
  onClose,
  onOrderCreated,
}) {
  const { token, user } = useAuth();

  const [address, setAddress] = useState({
    ...initialAddress,
    name: user?.name || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdOrder, setCreatedOrder] = useState(null);

  const cartItems = Object.entries(items)
    .map(([productId, quantity]) => {
      const product = products.find(
        (item) => (item._id ?? item.id) === productId
      );

      return product ? { product, productId, quantity } : null;
    })
    .filter(Boolean);

  const total = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  function updateAddress(event) {
    const { name, value } = event.target;
    setAddress((current) => ({ ...current, [name]: value }));
  }

  async function submitOrder(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await createOrder(token, {
        items: cartItems.map(({ productId, quantity }) => ({
          productId,
          quantity,
        })),
        shippingAddress: address,
      });

      const order = result.order;

      if (!order?._id) {
        throw new Error("The server did not return an order ID");
      }

      setCreatedOrder(order);
      onOrderCreated(order);
    } catch (err) {
      setError(err.message || "Unable to place your order");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <button
          onClick={onClose}
          aria-label="Close checkout"
          className="absolute right-5 top-5 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        >
          <X size={19} />
        </button>

        {createdOrder ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto text-emerald-500" size={54} />
            <h2 className="mt-5 text-2xl font-bold">Order placed!</h2>
            <p className="mt-2 text-sm text-slate-500">
              Your order has been created successfully.
            </p>

            <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-slate-50 p-5 text-left">
              <p className="text-sm text-slate-500">Order ID</p>
              <p className="mt-1 break-all font-semibold">
                {createdOrder._id}
              </p>
              <div className="mt-4 flex justify-between gap-4">
                <span className="text-sm text-slate-500">Total</span>
                <span className="font-bold">
                  {money(createdOrder.totalAmount)}
                </span>
              </div>
              <div className="mt-3 flex justify-between gap-4">
                <span className="text-sm text-slate-500">Status</span>
                <span className="text-sm font-semibold">
                  {createdOrder.status}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-7 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={onClose}
              className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft size={16} />
              Back to store
            </button>

            <h2 id="checkout-title" className="text-2xl font-bold">
              Checkout
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Enter your shipping details to place your order.
            </p>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <h3 className="font-semibold">Order summary</h3>
              <div className="mt-3 space-y-3">
                {cartItems.map(({ product, productId, quantity }) => (
                  <div
                    key={productId}
                    className="flex justify-between gap-4 text-sm"
                  >
                    <span className="text-slate-600">
                      {product.name} × {quantity}
                    </span>
                    <span className="font-medium">
                      {money(product.price * quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 font-bold">
                <span>Total</span>
                <span>{money(total)}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Payment is not integrated yet. No payment will be collected.
              </p>
            </div>

            <form onSubmit={submitOrder} className="mt-6 space-y-4">
              <h3 className="font-semibold">Shipping address</h3>

              {[
                ["name", "Full name", "text"],
                ["addressLine1", "Address", "text"],
                ["city", "City", "text"],
                ["state", "State", "text"],
                ["postalCode", "Postal code", "text"],
                ["country", "Country", "text"],
              ].map(([name, label, type]) => (
                <div key={name}>
                  <label
                    htmlFor={name}
                    className="mb-1.5 block text-sm font-medium"
                  >
                    {label}
                  </label>
                  <input
                    id={name}
                    name={name}
                    type={type}
                    required
                    autoComplete={
                      name === "addressLine1"
                        ? "street-address"
                        : name === "postalCode"
                          ? "postal-code"
                          : name
                    }
                    value={address[name]}
                    onChange={updateAddress}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              ))}

              {error && (
                <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || cartItems.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading && <LoaderCircle size={18} className="animate-spin" />}
                {loading ? "Placing order..." : "Place order"}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
