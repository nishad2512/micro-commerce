import prisma from "../lib/prisma.js";
import { cancelOrder } from "./order.service.js";
import amqplib from "amqplib";

export const handleInventoryFail = async (
    data: any,
    channel: amqplib.Channel,
) => {
    const res = await cancelOrder(parseInt(data.orderId));

    if(!res.success) {
        throw new Error(res.message);
    }

    channel.publish(
        "ecommerce.events",
        "payment.refund",
        Buffer.from(JSON.stringify(data)),
    );
};

export const handlePaymentFail = async (
    data: any,
    channel: amqplib.Channel,
) => {
    const res = await cancelOrder(parseInt(data.orderId));
    
    if(!res.success) {
        throw new Error(res.message);
    }

    channel.publish(
        "ecommerce.events",
        "inventory.release",
        Buffer.from(JSON.stringify(data)),
    );
};

export const handlePaymentSuccess = async (data: any) => {
    const order = await prisma.order.updateMany({
        where: {
            orderId: parseInt(data.orderId),
            status: { not: "CANCELLED" },
        },
        data: { status: "CONFIRMED" },
    });

    if (order.count === 0) {
        return { success: false, message: "Order not found" };
    }
};
