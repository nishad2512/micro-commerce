import { FormEvent, useCallback, useEffect, useState } from "react";
import type { ApiRequest, Order, OrderStatus, Product, User } from "./types";

const orderStatuses: OrderStatus[] = ["PENDING", "CONFIRMED", "SHIPPED", "CANCELLED"];

type AdminPageProps = {
    request: ApiRequest;
    onProductCreated: (product: Product) => void;
    onNotice: (notice: string) => void;
};

export default function AdminPage({ request, onProductCreated, onNotice }: AdminPageProps) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersError, setOrdersError] = useState("");
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [userId, setUserId] = useState("");
    const [foundUser, setFoundUser] = useState<User | null>(null);
    const [userError, setUserError] = useState("");
    const [busyOrder, setBusyOrder] = useState<number | null>(null);

    const loadOrders = useCallback(async () => {
        setLoadingOrders(true);
        setOrdersError("");
        try {
            setOrders(await request<Order[]>("/orders"));
        } catch (cause) {
            setOrdersError(cause instanceof Error ? cause.message : "Could not load orders");
        } finally {
            setLoadingOrders(false);
        }
    }, [request]);

    useEffect(() => {
        void loadOrders();
    }, [loadOrders]);

    const createProduct = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formElement = event.currentTarget;
        const form = new FormData(formElement);
        try {
            const product = await request<Product>("/products", {
                method: "POST",
                body: JSON.stringify({
                    title: form.get("title"),
                    description: form.get("description"),
                    price: Number(form.get("price")),
                    quantity: Number(form.get("quantity")),
                }),
            });
            onProductCreated(product);
            formElement.reset();
            onNotice(`Product "${product.title}" created.`);
        } catch (cause) {
            onNotice(cause instanceof Error ? cause.message : "Could not create product");
        }
    };

    const findUser = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFoundUser(null);
        setUserError("");
        try {
            setFoundUser(await request<User>(`/users/${encodeURIComponent(userId.trim())}`));
        } catch (cause) {
            setUserError(cause instanceof Error ? cause.message : "Could not find user");
        }
    };

    const changeOrderStatus = async (order: Order, status: OrderStatus) => {
        setBusyOrder(order.orderId);
        try {
            const updated = await request<Order>(`/orders/${order.orderId}`, {
                method: "PATCH",
                body: JSON.stringify({ status }),
            });
            setOrders((current) => current.map((entry) => entry.orderId === order.orderId
                ? { ...entry, ...updated, items: entry.items }
                : entry));
            onNotice(`Order #${order.orderId} updated.`);
        } catch (cause) {
            onNotice(cause instanceof Error ? cause.message : "Could not update order");
        } finally {
            setBusyOrder(null);
        }
    };

    return (
        <section className="page-shell admin-page">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">STORE OPERATIONS</p>
                    <h1>Admin</h1>
                    <p>Create products, review every order, update order status, and look up users.</p>
                </div>
            </div>

            <div className="admin-grid">
                <section className="admin-panel">
                    <p className="eyebrow">CATALOG</p>
                    <h2>Add a product</h2>
                    <form className="admin-form" onSubmit={createProduct}>
                        <label>Title<input name="title" required minLength={2} maxLength={160} /></label>
                        <label>Description<textarea name="description" required maxLength={2000} rows={3} /></label>
                        <div className="form-pair">
                            <label>Price<input name="price" type="number" min="0" max="1000000" step="0.01" required /></label>
                            <label>Quantity<input name="quantity" type="number" min="0" step="1" required /></label>
                        </div>
                        <button className="primary" type="submit">Create product</button>
                    </form>
                </section>

                <section className="admin-panel">
                    <p className="eyebrow">CUSTOMERS</p>
                    <h2>Find a user</h2>
                    <form className="admin-form" onSubmit={findUser}>
                        <label>User ID<input value={userId} onChange={(event) => setUserId(event.target.value)} required /></label>
                        <button className="secondary" type="submit">Look up user</button>
                    </form>
                    {userError && <p className="page-error" role="alert">{userError}</p>}
                    {foundUser && (
                        <div className="user-result">
                            <strong>{foundUser.name}</strong>
                            <span>{foundUser.email}</span>
                            <span>{foundUser.role} · {foundUser.id}</span>
                        </div>
                    )}
                </section>
            </div>

            <section className="admin-panel admin-orders">
                <div className="section-heading-inline">
                    <div>
                        <p className="eyebrow">FULFILMENT</p>
                        <h2>Manage orders</h2>
                    </div>
                    <button className="secondary" onClick={() => void loadOrders()} disabled={loadingOrders}>
                        {loadingOrders ? "Refreshing..." : "Refresh"}
                    </button>
                </div>
                {ordersError && <p className="page-error" role="alert">{ordersError}</p>}
                {!loadingOrders && !ordersError && orders.length === 0 && (
                    <div className="empty-state"><h2>No orders to manage</h2></div>
                )}
                <div className="admin-order-list">
                    {orders.map((order) => (
                        <article className="admin-order-row" key={order.orderId}>
                            <div>
                                <strong>Order #{order.orderId}</strong>
                                <span>{new Date(order.createdAt).toLocaleString()}</span>
                                <span>Customer {order.userId}</span>
                            </div>
                            <strong>${order.total.toFixed(2)}</strong>
                            <label>
                                <span className="sr-only">Status for order {order.orderId}</span>
                                <select
                                    value={order.status}
                                    disabled={busyOrder === order.orderId}
                                    onChange={(event) => {
                                        const status = event.target.value;
                                        if (orderStatuses.includes(status as OrderStatus)) {
                                            void changeOrderStatus(order, status as OrderStatus);
                                        }
                                    }}
                                >
                                    {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                                </select>
                            </label>
                        </article>
                    ))}
                </div>
            </section>
        </section>
    );
}
