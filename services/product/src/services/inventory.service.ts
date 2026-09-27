import type amqplib from "amqplib";
import { AppDataSource } from "../config/db.js";
import { Product } from "../enitity/Product.js";

export interface OrderItemEvent {
    prodId: number;
    quantity: number;
    price: number;
}
export interface OrderEvent {
    orderId: number;
    userId: string;
    total: number;
    items: OrderItemEvent[];
    correlationId?: string;
}
const publish = (
    channel: amqplib.Channel,
    key: string,
    event: OrderEvent & { reason?: string },
) =>
    channel.publish(
        "ecommerce.events",
        key,
        Buffer.from(JSON.stringify(event)),
        {
            persistent: true,
            contentType: "application/json",
            messageId: `${key}:${event.orderId}`,
        },
    );

export async function handleOrderCreate(
    data: OrderEvent,
    channel: amqplib.Channel,
): Promise<void> {
    try {
        await AppDataSource.transaction(async (manager) => {
            for (const item of data.items) {
                const product = await manager
                    .getRepository(Product)
                    .findOne({
                        where: { productId: item.prodId },
                        lock: { mode: "pessimistic_write" },
                    });
                if (!product || product.quantity < item.quantity)
                    throw new Error(
                        `Insufficient inventory for product ${item.prodId}`,
                    );
                product.quantity -= item.quantity;
                await manager.save(product);
            }
        });
        publish(channel, "inventory.reserved", data);
    } catch (error) {
        publish(channel, "inventory.failed", {
            ...data,
            reason:
                error instanceof Error
                    ? error.message
                    : "Inventory reservation failed",
        });
    }
}

export async function handleInventoryRelease(
    data: OrderEvent,
    channel: amqplib.Channel,
): Promise<void> {
    await AppDataSource.transaction(async (manager) => {
        for (const item of data.items) {
            const product = await manager
                .getRepository(Product)
                .findOne({
                    where: { productId: item.prodId },
                    lock: { mode: "pessimistic_write" },
                });
            if (!product)
                throw new Error(
                    `Product ${item.prodId} was not found during inventory release`,
                );
            product.quantity += item.quantity;
            await manager.save(product);
        }
    });
    publish(channel, "inventory.released", data);
}
