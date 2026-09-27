import { cancelOrder } from "./order.service.js";
import amqplib from "amqplib";
import type { OrderEvent } from "./order.service.js";

export const handleInventoryFail = async (
    data: OrderEvent,
    channel: amqplib.Channel,
) => {
    const res = await cancelOrder(data.orderId);

    if(!res.success) {
        throw new Error("Order could not be cancelled");
    }

    channel.publish(
        "ecommerce.events",
        "payment.refund",
        Buffer.from(JSON.stringify(data)),
        { persistent: true },
    );
};

export const handlePaymentFail = async (
    data: OrderEvent,
    channel: amqplib.Channel,
) => {
    const res = await cancelOrder(data.orderId);
    
    if(!res.success) {
        throw new Error("Order could not be cancelled");
    }

    channel.publish(
        "ecommerce.events",
        "inventory.release",
        Buffer.from(JSON.stringify(data)),
        { persistent: true },
    );
};

export const handlePaymentSuccess = async (data: OrderEvent) => {
    const { updateOrderStatus } = await import("./order.service.js");
    await updateOrderStatus(data.orderId, "CONFIRMED");
};
