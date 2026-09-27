import { useCallback, useEffect, useState } from "react";
import type { ApiRequest, Order } from "./types";

type OrdersPageProps = {
    request: ApiRequest;
    isAdmin: boolean;
};

export default function OrdersPage({ request, isAdmin }: OrdersPageProps) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const loadOrders = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            setOrders(await request<Order[]>("/orders"));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Could not load orders");
        } finally {
            setLoading(false);
        }
    }, [request]);

    useEffect(() => {
        void loadOrders();
    }, [loadOrders]);

    return (
        <section className="page-shell">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">{isAdmin ? "ORDER MANAGEMENT" : "YOUR ACCOUNT"}</p>
                    <h1>{isAdmin ? "All orders" : "Order history"}</h1>
                    <p>{isAdmin ? "Review orders across the store." : "A record of the things you have ordered."}</p>
                </div>
                <button className="secondary" onClick={() => void loadOrders()} disabled={loading}>
                    {loading ? "Refreshing..." : "Refresh"}
                </button>
            </div>
            {error && <p className="page-error" role="alert">{error}</p>}
            {!loading && !error && orders.length === 0 && (
                <div className="empty-state">
                    <h2>No orders yet</h2>
                    <p>Your completed checkouts will appear here.</p>
                </div>
            )}
            <div className="order-list">
                {orders.map((order) => (
                    <article className="order-card" key={order.orderId}>
                        <div className="order-card-heading">
                            <div>
                                <p className="eyebrow">ORDER #{order.orderId}</p>
                                <p className="muted">
                                    {new Date(order.createdAt).toLocaleString()}
                                    {isAdmin && ` · Customer ${order.userId}`}
                                </p>
                            </div>
                            <span className={`status status-${order.status.toLowerCase()}`}>
                                {order.status}
                            </span>
                        </div>
                        <div className="order-items">
                            {order.items.map((item, index) => (
                                <div className="order-item" key={item.itemId ?? `${order.orderId}-${item.prodId}-${index}`}>
                                    <span>Product #{item.prodId} · Qty {item.quantity}</span>
                                    <strong>${(item.price * item.quantity).toFixed(2)}</strong>
                                </div>
                            ))}
                        </div>
                        <div className="order-total">
                            <span>Total</span>
                            <strong>${order.total.toFixed(2)}</strong>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
