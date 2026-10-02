
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShoppingBag,
  ShoppingCart,
  Plus,
  Minus,
  PackageSearch,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "./context/AuthContext";
import AuthModal from "./components/AuthModal";
import CheckoutModal from "./components/CheckoutModal";

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount ?? 0);

export default function App() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user, isAuthenticated, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false); 
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderNotice, setOrderNotice] = useState("");

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/products");

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const data = await response.json();
      const list = Array.isArray(data)
        ? data
        : data.products ?? data.data ?? [];

      setProducts(list.filter((product) => product.isActive !== false));
    } catch (err) {
      setError(
        `${err.message}. Check that the API Gateway and Product Service are running.`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((p) => p.category).filter(Boolean))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        category === "All" || product.category === category;

      const matchesSearch =
        !term ||
        product.name?.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [products, search, category]);

  const cartCount = Object.values(cart).reduce(
    (total, quantity) => total + quantity,
    0
  );

  function updateCart(productId, change) {
    setCart((current) => {
      const nextQuantity = (current[productId] ?? 0) + change;
      const updated = { ...current };

      if (nextQuantity <= 0) {
        delete updated[productId];
      } else {
        updated[productId] = nextQuantity;
      }

      return updated;
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <ShoppingBag size={21} />
            </span>
            <span>
              <span className="block text-lg font-bold tracking-tight">
                Shopwise
              </span>
              <span className="block text-xs text-slate-500">
                Everyday essentials
              </span>
            </span>
          </a>

          <div className="hidden max-w-md flex-1 md:block">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
              <Search size={18} className="text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products..."
                className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm text-slate-600 sm:inline">
                Hi, {user?.name || user?.email || "there"}
              </span>
              <button
                onClick={logout}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold hover:bg-slate-50"
              >
                Log out
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold hover:bg-slate-50"
            >
              Log in
            </button>
          )}

          <button
            onClick={() =>
              document.getElementById("products")?.scrollIntoView({
                behavior: "smooth",
              })
            }
            className="relative flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <ShoppingCart size={18} />
            <span className="hidden sm:inline">Cart</span>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs text-slate-900">
              {cartCount}
            </span>
          </button>
        </div>
        </div>

        <div className="px-5 pb-3 md:hidden">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products..."
              className="w-full bg-transparent py-2.5 text-sm outline-none"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-10 text-white sm:px-10 sm:py-14">
          <div className="relative z-10 max-w-xl">
            <span className="mb-4 inline-flex rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-slate-200">
              YOUR EVERYDAY STORE
            </span>
            <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              Good finds.
              <br />
              Better everyday.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300 sm:text-base">
              Discover useful essentials and products picked for your daily
              needs.
            </p>
            <button
              onClick={() =>
                document.getElementById("products")?.scrollIntoView({
                  behavior: "smooth",
                })
              }
              className="mt-7 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Explore products
            </button>
          </div>
          <div className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full border-[45px] border-white/5 sm:right-10 sm:top-0" />
          <div className="pointer-events-none absolute -bottom-32 right-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        </section>

        <section id="products" className="scroll-mt-28 pt-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-indigo-600">
                THE COLLECTION
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Explore products
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {filteredProducts.length} products available
              </p>
            </div>

            <button
              onClick={loadProducts}
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-100"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  category === item
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid min-h-60 place-items-center">
              <div className="text-center">
                <RefreshCw className="mx-auto animate-spin text-slate-400" />
                <p className="mt-3 text-sm text-slate-500">
                  Loading products...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6">
              <p className="font-semibold text-red-800">
                Unable to load products
              </p>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <button
                onClick={loadProducts}
                className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white"
              >
                Try again
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-16 text-center">
              <PackageSearch className="mx-auto text-slate-400" size={34} />
              <h3 className="mt-4 font-semibold">No products found</h3>
              <p className="mt-1 text-sm text-slate-500">
                Try another search or category.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => {
                const id = product._id ?? product.id;
                const quantity = cart[id] ?? 0;

                return (
                  <article
                    key={id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60"
                  >
                    <div className="relative flex h-52 items-center justify-center overflow-hidden bg-slate-100">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-slate-300">
                          <PackageSearch size={38} />
                        </div>
                      )}
                      {product.category && (
                        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-slate-600">
                          {product.category}
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="truncate font-semibold">
                        {product.name}
                      </h3>
                      <p className="mt-1 h-10 overflow-hidden text-sm leading-5 text-slate-500">
                        {product.description || "A useful everyday essential."}
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-bold">
                            {money(product.price)}
                          </p>
                          <p
                            className={`mt-0.5 text-xs ${
                              product.stock > 0
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {product.stock > 0
                              ? `${product.stock} in stock`
                              : "Out of stock"}
                          </p>
                        </div>

                        {quantity === 0 ? (
                          <button
                            disabled={product.stock < 1}
                            onClick={() => updateCart(id, 1)}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            <Plus size={16} />
                            Add
                          </button>
                        ) : (
                          <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-2 py-1.5">
                            <button
                              aria-label="Remove one"
                              onClick={() => updateCart(id, -1)}
                              className="rounded-md p-1 hover:bg-slate-100"
                            >
                              <Minus size={15} />
                            </button>
                            <span className="min-w-4 text-center text-sm font-semibold">
                              {quantity}
                            </span>
                            <button
                              aria-label="Add one"
                              disabled={quantity >= product.stock}
                              onClick={() => updateCart(id, 1)}
                              className="rounded-md p-1 hover:bg-slate-100 disabled:opacity-30"
                            >
                              <Plus size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
                
        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold">Your cart</h2>
              <p className="mt-1 text-sm text-slate-500">
                {cartCount} item{cartCount === 1 ? "" : "s"} selected
              </p>
            </div>

            <button
              disabled={cartCount === 0}
              onClick={() => {
                if (!isAuthenticated) {
                  setShowAuth(true);
                } else {
                  setShowCheckout(true);
                }
              }}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isAuthenticated ? "Proceed to checkout" : "Log in to checkout"}
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {Object.entries(cart).map(([productId, quantity]) => {
              const product = products.find(
                (item) => (item._id ?? item.id) === productId
              );

              if (!product) return null;

              return (
                <div
                  key={productId}
                  className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-slate-500">
                      {quantity} × ₹{product.price}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCart(productId, -1)}
                      className="rounded-lg border px-3 py-1.5"
                      aria-label={`Remove one ${product.name}`}
                    >
                      −
                    </button>
                    <span>{quantity}</span>
                    <button
                      disabled={quantity >= product.stock}
                      onClick={() => updateCart(productId, 1)}
                      className="rounded-lg border px-3 py-1.5 disabled:opacity-40"
                      aria-label={`Add one ${product.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {orderNotice && (
            <p className="mt-4 text-sm text-emerald-700">{orderNotice}</p>
          )}
        </section>

        {showCheckout && (
          <CheckoutModal
            items={cart}
            products={products}
            onClose={() => setShowCheckout(false)}
            onOrderCreated={(order) => {
              setCart({});
              setOrderNotice(`Order ${order._id} placed successfully.`);
            }}
          />
        )}


        <footer className="mt-16 border-t border-slate-200 py-6 text-center text-sm text-slate-500">
          Shopwise · Built with React and microservices
        </footer>
      </main>
      {showAuth && (
          <AuthModal onClose={() => setShowAuth(false)} />
        )}
    </div>
  );
}
