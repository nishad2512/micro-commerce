import amqplib from "amqplib";
import {
    handleInventoryFail,
    handlePaymentFail,
    handlePaymentSuccess,
} from "../services/msg.service.js";

async function startMQ() {
    const connection = await amqplib.connect(
        process.env.RABBITMQ_URI || "amqp://localhost:5672",
    );
    const channel = await connection.createChannel();

    console.log("RabbitMQ connected in order services");

    channel.assertExchange("ecommerce.events", "topic", { durable: true });
    const queue = await channel.assertQueue("order.queue");

    channel.bindQueue(queue.queue, "ecommerce.events", "inventory.failed");
    channel.bindQueue(queue.queue, "ecommerce.events", "payment.success");
    channel.bindQueue(queue.queue, "ecommerce.events", "payment.failed");

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
        } catch (err: any) {
            console.error("Error Order RabbitMQ: ", err.message);
        }
    });

    return channel;
}

export default startMQ;
