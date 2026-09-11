import amqplib from "amqplib";
import { getProductRepository } from "../config/db.js";
import { MoreThanOrEqual } from "typeorm";

export async function handleOrderCreate(data: any, channel: amqplib.Channel) {
    const prod = getProductRepository();
    for (let item of data.items) {
        const product = await prod.findOne({
            where: {
                productId: item.prodId,
                quantity: MoreThanOrEqual(item.quantity),
            },
        });
        if (!product) {
            channel.publish(
                "ecommerce.events",
                "inventory.fail",
                Buffer.from(
                    JSON.stringify({
                        ...data,
                        reason: "Product not found",
                    }),
                ),
            );

            return;
        }
        product.quantity -= item.quantity;
        await prod.save(product);
    }
    console.log("Inventory reserved successfully");

    channel.publish(
        "ecommerce.events",
        "inventory.reserved",
        Buffer.from(JSON.stringify(data)),
    );
}

export async function handleInventoryRelease(
    data: any,
    channel: amqplib.Channel,
) {
    const prod = getProductRepository();
    for (let item of data.items) {
        const product = await prod.findOne({
            where: { productId: item.prodId },
        });
        if (!product) {
            channel.publish(
                "ecommerce.events",
                "inventory.release.fail",
                Buffer.from(JSON.stringify(data)),
            );
            return;
        }

        product.quantity += item.quantity;
        await prod.save(product);
    }
    console.log("Inventory released successfully");

    channel.publish(
        "ecommerce.events",
        "inventory.released",
        Buffer.from(JSON.stringify(data)),
    );
}
