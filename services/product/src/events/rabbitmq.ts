import amqplib from "amqplib";
import { handleInventoryRelease, handleOrderCreate } from "../services/inventory.service.js";

async function startMQ() {
    const connection = await amqplib.connect("amqp://rabbitmq:5672");
    const channel = await connection.createChannel();

    console.log("RabbitMQ started");

    await channel.assertExchange("ecommerce.events", "topic", {
        durable: true,
    });
    const queue = await channel.assertQueue("inventory.queue", {
        durable: true,
    });

    await channel.bindQueue(queue.queue, "ecommerce.events", "order.created");
    await channel.bindQueue(queue.queue, "ecommerce.events", "inventory.release");

    channel.consume(queue.queue, async (message) => {
        if (!message) return;

        try {
            const routingKey = message.fields.routingKey;
            const data = JSON.parse(message.content.toString());
            console.log("Recieved: ", routingKey);
            console.log("Data: ", data);

            switch (routingKey) {
                case "order.created":
                    await handleOrderCreate(data, channel);
                    break;

                case "inventory.release":
                    await handleInventoryRelease(data, channel);
                    break;

                default:
                    console.warn("Unknown routing key", routingKey);
            }
            channel.ack(message);
        } catch (err: any) {
            console.error("Inventory Error: ", err.message)
        }
    });
}

export default startMQ;
