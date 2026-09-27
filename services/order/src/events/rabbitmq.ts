import amqplib from "amqplib";
import {
    handleInventoryFail,
    handlePaymentFail,
    handlePaymentSuccess,
} from "../services/msg.service.js";

let mqchannel: null | amqplib.Channel = null;

async function startMQ() {
    const connection = await amqplib.connect(
        process.env.RABBITMQ_URL || "amqp://localhost:5672",
    );
    const channel = await connection.createChannel();

    mqchannel = channel;

    console.log("RabbitMQ connected in order services");

    await channel.assertExchange("ecommerce.events", "topic", { durable: true });
    const queue = await channel.assertQueue("order.queue", { durable: true });

    await channel.bindQueue(queue.queue, "ecommerce.events", "inventory.failed");
    await channel.bindQueue(queue.queue, "ecommerce.events", "payment.success");
    await channel.bindQueue(queue.queue, "ecommerce.events", "payment.failed");

    channel.consume(queue.queue, async (msg) => {
        if (!msg) return;

        try {
            const routingKey = msg.fields.routingKey;
            const data = JSON.parse(msg.content.toString());

            console.log("Received:", routingKey);
            console.log("Data:", data);

            switch (routingKey) {
                case "inventory.failed":
                    await handleInventoryFail(data, channel);
                    break;

                case "payment.success":
                    await handlePaymentSuccess(data);
                    break;

                case "payment.failed":
                    await handlePaymentFail(data, channel);
                    break;

                default:
                    console.log("Unknown event: ", routingKey);
            }

            channel.ack(msg);
        } catch (err) {
            console.error("Error Order RabbitMQ: ", err instanceof Error ? err.message : err);
            channel.nack(msg, false, false);
        }
    });
}

export const getChannel = () => {
    if (!mqchannel) {
        throw new Error("RabbitMQ channel has not been initialized yet. Call startMQ() first.");
    }
    return mqchannel;
}

export default startMQ;
