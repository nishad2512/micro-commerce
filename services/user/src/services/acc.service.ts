import { Wallet } from "../models/User.js";
import amqplib from "amqplib";

export const pay = async (order: any) => {
    const wallet = await Wallet.findOne({ userId: order.userId });

    if (!wallet) {
        return { success: false, message: "User wallet not found" };
    }

    if (wallet.balance < order.total) {
        return { success: false, message: "Insufficient balance" };
    }

    const match = wallet.transactions.find((t) => t.orderId == order.orderId);

    if (match) {
        return { success: false, message: "Already paid" };
    }

    wallet.balance -= order.total;
    wallet.transactions.push({
        amount: order.total,
        orderId: order.orderId,
        status: "SUCCESS",
    });
    await wallet.save();

    return { success: true };
};

export const handleInventoryFail = async (data: any) => {
    const walletExists = await Wallet.findOne({
        userId: data.userId,
        transactions: {
            $elemMatch: { orderId: data.orderId, status: "SUCCESS" },
        },
    });

    if (!walletExists) {
        throw new Error(
            `Successful payment for order ${data.orderId} was not found.`,
        );
    }

    await Wallet.findOneAndUpdate(
        { userId: data.userId },
        {
            $inc: { balance: parseInt(data.total) },
            $set: { "transactions.$[elem].status": "REFUNDED" },
        },
        {
            new: true,
            arrayFilters: [
                { "elem.orderId": data.orderId, "elem.status": "SUCCESS" },
            ],
        },
    );
};

export const handleOrderCreated = async (
    channel: amqplib.Channel,
    data: any,
) => {
    const result: { success: boolean; message?: string } = await pay(data);

    if (result.success) {
        channel.publish(
            "ecommerce.events",
            "payment.success",
            Buffer.from(
                JSON.stringify({
                    orderId: data.orderId,
                    amount: data.total,
                    userId: data.userId,
                }),
            ),
            { persistent: true },
        );

        console.log(`Payment successfull: ${data.orderId}`);

        return;
    }

    channel.publish(
        "ecommerce.events",
        "payment.failed",
        Buffer.from(JSON.stringify({ ...data, reason: result.message })),
        { persistent: true },
    );

    console.log(`Payment failed: ${data.orderId}`);
};
