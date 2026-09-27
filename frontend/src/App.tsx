import { FormEvent, useEffect, useMemo, useState } from "react";
import AdminPage from "./pages/AdminPage";
import OrdersPage from "./pages/OrdersPage";
import WalletPage from "./pages/WalletPage";
import type { Product, User } from "./pages/types";

type CartItem = Product & { count: number };
const apiUrl = import.meta.env.VITE_API_URL ?? "/api";

let accessToken = "";
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    let response = await fetch(`${apiUrl}${path}`, {
        ...init,
        headers,
        credentials: "include",
    });
    if (response.status === 401 && path !== "/auth/refresh") {
        const refresh = await fetch(`${apiUrl}/auth/refresh`, {
            method: "POST",
            credentials: "include",
        });
        if (refresh.ok) {
            accessToken = (await refresh.json()).data.accessToken as string;
            headers.set("Authorization", `Bearer ${accessToken}`);
            response = await fetch(`${apiUrl}${path}`, {
                ...init,
                headers,
                credentials: "include",
            });
        }
    }
    const body = (await response.json().catch(() => ({}))) as {
        message?: string;
        data?: T;
    };
    if (!response.ok) throw new Error(body.message ?? "Request failed");
    return body.data as T;
}

export default function App() {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [view, setView] = useState<
        "shop" | "cart" | "account" | "orders" | "wallet" | "admin"
    >("shop");
    const [notice, setNotice] = useState("");
    const [authOpen, setAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState<"login" | "register">("login");
    const total = useMemo(
        () => cart.reduce((sum, item) => sum + item.price * item.count, 0),
        [cart],
    );

    useEffect(() => {
        request<{ products: Product[] }>("/products")
            .then((data) => setProducts(data.products))
            .catch((error: Error) => setNotice(error.message));
    }, []);
    const add = (product: Product) =>
        setCart((current) => {
            const found = current.find(
                (item) => item.productId === product.productId,
            );
            return found
                ? current.map((item) =>
                      item.productId === product.productId
                          ? {
                                ...item,
                                count: Math.min(
                                    item.count + 1,
                                    product.quantity,
                                ),
                            }
                          : item,
                  )
                : [...current, { ...product, count: 1 }];
        });
    const checkout = async () => {
        try {
            await request("/orders", {
                method: "POST",
                headers: {
                    Authorization: "Bearer YOUR_ACCESS_TOKEN",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    items: cart.map(({ productId, count }) => ({
                        prodId: productId,
                        quantity: count,
                    })),
                }),
            });
            setCart([]);
            setNotice("Order placed. We are reserving your inventory now.");
            setView("orders");
        } catch (error) {
            setNotice(
                error instanceof Error ? error.message : "Checkout failed",
            );
        }
    };
    const authenticate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        try {
            const result = await request<{ accessToken: string; user: User }>(
                authMode === "login" ? "/auth/login" : "/auth/register",
                {
                    method: "POST",
                    body: JSON.stringify({
                        ...(authMode === "register"
                            ? { name: data.get("name") }
                            : {}),
                        email: data.get("email"),
                        password: data.get("password"),
                    }),
                },
            );
            accessToken = result.accessToken;
            setUser(result.user);
            setAuthOpen(false);
            setNotice(`Welcome, ${result.user.name}.`);
        } catch (error) {
            setNotice(
                error instanceof Error ? error.message : "Could not sign in",
            );
        }
    };

    return (
        <main>
            <header>
                <button className="brand" onClick={() => setView("shop")}>
                    NORTHSTAR<span>MARKET</span>
                </button>
                <nav>
                    <button onClick={() => setView("shop")}>Shop</button>
                    {user ? (
                        <>
                            <button onClick={() => setView("orders")}>Orders</button>
                            <button onClick={() => setView("wallet")}>Wallet</button>
                            {user.role === "admin" && (
                                <button onClick={() => setView("admin")}>Admin</button>
                            )}
                            <button onClick={() => setView("account")}>Account</button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    setAuthMode("login");
                                    setAuthOpen(true);
                                }}
                            >
                                Sign in
                            </button>
                            <button
                                className="signup"
                                onClick={() => {
                                    setAuthMode("register");
                                    setAuthOpen(true);
                                }}
                            >
                                Create account
                            </button>
                        </>
                    )}
                    <button className="bag" onClick={() => setView("cart")}>
                        Bag <b>{cart.length}</b>
                    </button>
                </nav>
            </header>
            {notice && (
                <div className="notice" role="status">
                    {notice}
                    <button onClick={() => setNotice("")}>x</button>
                </div>
            )}
            {view === "shop" && (
                <>
                    <section className="hero">
                        <div>
                            <p className="eyebrow">AUTUMN EDIT</p>
                            <h1>
                                Everyday goods,
                                <br />
                                considered.
                            </h1>
                            <p>
                                Useful objects and quiet upgrades, selected for
                                the pace of real life.
                            </p>
                            <button
                                className="primary"
                                onClick={() =>
                                    document
                                        .getElementById("products")
                                        ?.scrollIntoView({ behavior: "smooth" })
                                }
                            >
                                Explore the collection
                            </button>
                        </div>
                    </section>
                    <section id="products" className="catalog">
                        <div className="section-head">
                            <p className="eyebrow">SHOP</p>
                            <h2>New arrivals</h2>
                            <span>{products.length} pieces</span>
                        </div>
                        <div className="product-grid">
                            {products.map((product, index) => (
                                <article key={product.productId}>
                                    <div
                                        className={`product-image image-${index % 4}`}
                                    >
                                        <span>
                                            {product.quantity
                                                ? "In stock"
                                                : "Sold out"}
                                        </span>
                                    </div>
                                    <div className="product-copy">
                                        <h3>{product.title}</h3>
                                        <p>{product.description}</p>
                                        <div>
                                            <strong>
                                                ${product.price.toFixed(2)}
                                            </strong>
                                            <button
                                                aria-label={`Add ${product.title} to bag`}
                                                disabled={!product.quantity}
                                                onClick={() => add(product)}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                </>
            )}
            {view === "cart" && (
                <section className="drawer">
                    <p className="eyebrow">YOUR BAG</p>
                    <h2>
                        {cart.length
                            ? "Ready when you are."
                            : "Your bag is empty."}
                    </h2>
                    {cart.map((item) => (
                        <div className="line" key={item.productId}>
                            <span>{item.title}</span>
                            <span>
                                {item.count} x ${item.price.toFixed(2)}
                            </span>
                            <button
                                onClick={() =>
                                    setCart((items) =>
                                        items.filter(
                                            (entry) =>
                                                entry.productId !==
                                                item.productId,
                                        ),
                                    )
                                }
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                    {cart.length > 0 && (
                        <>
                            <div className="total">
                                <span>Total</span>
                                <strong>${total.toFixed(2)}</strong>
                            </div>
                            <button
                                className="primary"
                                disabled={!user}
                                onClick={checkout}
                            >
                                {user ? "Checkout" : "Sign in to checkout"}
                            </button>
                        </>
                    )}
                </section>
            )}
            {view === "account" && (
                <section className="drawer">
                    <p className="eyebrow">ACCOUNT</p>
                    <h2>
                        {user
                            ? `Hello, ${user.name}.`
                            : "A better way to shop."}
                    </h2>
                    {user ? (
                        <>
                            <p>{user.email}</p>
                            <button
                                className="primary"
                                onClick={() => setView("cart")}
                            >
                                Review your bag
                            </button>
                        </>
                    ) : (
                        <button
                            className="primary"
                            onClick={() => {
                                setAuthMode("login");
                                setAuthOpen(true);
                            }}
                        >
                            Sign in
                        </button>
                    )}
                </section>
            )}
            {view === "orders" && user && (
                <OrdersPage request={request} isAdmin={user.role === "admin"} />
            )}
            {view === "wallet" && user && <WalletPage request={request} />}
            {view === "admin" && user?.role === "admin" && (
                <AdminPage
                    request={request}
                    onProductCreated={(product) =>
                        setProducts((current) => [product, ...current])
                    }
                    onNotice={setNotice}
                />
            )}
            {authOpen && (
                <div className="modal">
                    <form onSubmit={authenticate}>
                        <button
                            type="button"
                            className="close"
                            onClick={() => setAuthOpen(false)}
                        >
                            x
                        </button>
                        <p className="eyebrow">
                            {authMode === "login" ? "WELCOME BACK" : "NEW HERE"}
                        </p>
                        <h2>
                            {authMode === "login"
                                ? "Sign in"
                                : "Create account"}
                        </h2>
                        {authMode === "register" && (
                            <label>
                                Name
                                <input
                                    name="name"
                                    required
                                    autoComplete="name"
                                />
                            </label>
                        )}
                        <label>
                            Email
                            <input
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                            />
                        </label>
                        <label>
                            Password
                            <input
                                name="password"
                                type="password"
                                required
                                autoComplete="current-password"
                            />
                        </label>
                        <button className="primary" type="submit">
                            {authMode === "login"
                                ? "Continue"
                                : "Create account"}
                        </button>
                        <button
                            type="button"
                            className="switch-auth"
                            onClick={() =>
                                setAuthMode((mode) =>
                                    mode === "login" ? "register" : "login",
                                )
                            }
                        >
                            {authMode === "login"
                                ? "Create an account"
                                : "Already have an account? Sign in"}
                        </button>
                    </form>
                </div>
            )}
        </main>
    );
}
