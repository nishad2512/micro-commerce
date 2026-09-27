export type Product = {
    productId: number;
    title: string;
    description: string;
    price: number;
    quantity: number;
};

export type User = {
    id: string;
    name: string;
    email: string;
    role: "user" | "admin";
};

export type OrderStatus = "PENDING" | "CANCELLED" | "CONFIRMED" | "SHIPPED";

export type Order = {
    orderId: number;
    userId: string;
    total: number;
    status: OrderStatus;
    createdAt: string;
    items: Array<{
        itemId?: number;
        prodId: number;
        quantity: number;
        price: number;
    }>;
};

export type Wallet = {
    balance: number;
    transactions: Array<{
        amount: number;
        orderId: string;
        status: "SUCCESS" | "REFUNDED";
        type: "ORDER" | "TOP_UP";
    }>;
};

export type ApiRequest = <T>(
    path: string,
    init?: RequestInit,
) => Promise<T>;
