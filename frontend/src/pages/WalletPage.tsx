import { FormEvent, useCallback, useEffect, useState } from "react";
import type { ApiRequest, Wallet } from "./types";

export default function WalletPage({ request }: { request: ApiRequest }) {
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [topUpAmount, setTopUpAmount] = useState("");
    const [topUpBusy, setTopUpBusy] = useState(false);
    const [topUpMessage, setTopUpMessage] = useState("");

    const loadWallet = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            setWallet(await request<Wallet>("/users/me/wallet"));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Could not load wallet");
        } finally {
            setLoading(false);
        }
    }, [request]);

    useEffect(() => {
        void loadWallet();
    }, [loadWallet]);

    const addDummyFunds = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setTopUpBusy(true);
        setTopUpMessage("");
        setError("");
        try {
            const updated = await request<Wallet>("/users/me/wallet/top-up", {
                method: "POST",
                body: JSON.stringify({ amount: Number(topUpAmount) }),
            });
            setWallet(updated);
            setTopUpAmount("");
            setTopUpMessage("Test funds added to your wallet.");
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Could not add test funds");
        } finally {
            setTopUpBusy(false);
        }
    };

    return (
        <section className="page-shell">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">YOUR ACCOUNT</p>
                    <h1>Wallet</h1>
                    <p>Wallet balance and order payment activity.</p>
                </div>
                <button className="secondary" onClick={() => void loadWallet()} disabled={loading}>
                    {loading ? "Refreshing..." : "Refresh"}
                </button>
            </div>
            {error && <p className="page-error" role="alert">{error}</p>}
            {wallet && (
                <>
                    <div className="wallet-balance">
                        <p className="eyebrow">AVAILABLE BALANCE</p>
                        <strong>${wallet.balance.toFixed(2)}</strong>
                        <p>Payments and refunds from your orders update this balance.</p>
                    </div>
                    <form className="wallet-top-up" onSubmit={addDummyFunds}>
                        <div>
                            <p className="eyebrow">DEVELOPMENT ONLY</p>
                            <h2>Add test funds</h2>
                            <p>This adds simulated funds only. No real payment is made.</p>
                        </div>
                        <label>
                            Amount
                            <span className="wallet-amount-input">
                                <span>$</span>
                                <input
                                    aria-label="Dummy funds amount"
                                    type="number"
                                    min="0.01"
                                    max="10000"
                                    step="0.01"
                                    required
                                    value={topUpAmount}
                                    onChange={(event) => setTopUpAmount(event.target.value)}
                                />
                            </span>
                        </label>
                        <button className="primary" type="submit" disabled={topUpBusy}>
                            {topUpBusy ? "Adding..." : "Add test funds"}
                        </button>
                    </form>
                    {topUpMessage && <p className="success-message" role="status">{topUpMessage}</p>}
                    <div className="section-heading-inline">
                        <h2>Transactions</h2>
                        <span>{wallet.transactions.length} entries</span>
                    </div>
                    {wallet.transactions.length === 0 ? (
                        <div className="empty-state">
                            <h2>No transactions yet</h2>
                            <p>Order payments and refunds will be listed here.</p>
                        </div>
                    ) : (
                        <div className="transaction-list">
                            {wallet.transactions.map((transaction, index) => (
                                <article className="transaction-row" key={`${transaction.orderId}-${index}`}>
                                    <div>
                                        <strong>
                                            {transaction.type === "TOP_UP"
                                                ? "Test funds added"
                                                : `Order #${transaction.orderId}`}
                                        </strong>
                                        <span className={`status status-${transaction.status.toLowerCase()}`}>
                                            {transaction.status}
                                        </span>
                                    </div>
                                    <strong className={transaction.type === "TOP_UP" || transaction.status === "REFUNDED" ? "amount-refund" : ""}>
                                        {transaction.type === "TOP_UP" || transaction.status === "REFUNDED" ? "+" : "−"}${transaction.amount.toFixed(2)}
                                    </strong>
                                </article>
                            ))}
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
