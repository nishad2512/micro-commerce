import amqplib from "amqplib";
import {
    handleInventoryFail,
    handleOrderCreated,
} from "../services/acc.service.js";

async function startMQ() {
    const conn = await amqplib.connect(
        process.env.RABBITMQ_URI || "amqp://localhost:5672",
    );
    const channel = await conn.createChannel();

    console.log("RabbitMQ connected in user services");

    // work queue

    await channel.assertExchange("ecommerce.events", "topic", {
        durable: true,
    });
    const queue = await channel.assertQueue("user.queue", { durable: true });

    await channel.bindQueue(queue.queue, "ecommerce.events", "order.created");
    await channel.bindQueue(queue.queue, "ecommerce.events", "payment.refund");

    // dead-letter queue

    await channel.assertExchange("ecommerce.dlq", "topic", { durable: true });
    await channel.assertQueue("user.dlq", { durable: true });
    await channel.bindQueue("user.dlq", "ecommerce.dlq", "dlq.key");

    // retry

    await channel.assertExchange("ecommerce.retry", "topic", { durable: true });
    await channel.assertQueue("user.retry", {
        durable: true,
        arguments: {
            "x-dead-letter-exchange": "",
            "x-dead-letter-routing-key": "user.queue",
            "x-message-ttl": 5000,
        },
    });
    await channel.bindQueue("user.retry", "ecommerce.retry", "retry.key");

    // listen

    channel.consume(queue.queue, async (message) => {
        if (!message) return;

        const headers = message.properties.headers || {};
        const routingKey = headers["x-original-routing-key"] || message.fields.routingKey;
        const retryCount = headers["x-retry-count"] || 0;

        try {
            const data = JSON.parse(message.content.toString());
            console.log("Recieved: ", routingKey);
            console.log("Data: ", data);

            switch (routingKey) {
                case "order.created":
                    await handleOrderCreated(channel, data);
                    break;

                case "payment.refund":
                    await handleInventoryFail(data);
                    console.log(`Payment refunded: ${data.orderId}`);
                    break;

                default:
                    console.warn(`Unknow event: ${routingKey}`);
            }

            channel.ack(message);
        } catch (err: any) {
            console.error("Error User RabbitMQ: ", err.message);

            if (retryCount >= 3) {
                console.log("Max retries reached for message.");

                channel.publish("ecommerce.dlq", "dlq.key", message.content, {
                    persistent: true,
                    headers: {
                        ...headers,
                        "x-original-routing-key": routingKey,
                        "x-error-reason": err.message,
                    },
                });
            } else {
                console.log(`Scheduling retry ${retryCount + 1}/3 in 5s.`);

                channel.publish(
                    "ecommerce.retry",
                    "retry.key",
                    message.content,
                    {
                        persistent: true,
                        headers: {
                            ...headers,
                            "x-original-routing-key": routingKey,
                            "x-retry-count": retryCount + 1,
                        },
                    },
                );
            }

            channel.ack(message);
        }
    });
}

export default startMQ;
