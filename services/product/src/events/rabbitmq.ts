import amqplib from "amqplib";

async function startMQ() {
    const connection = await amqplib.connect("amqp://localhost:5672");
    const channel = await connection.createChannel();

    console.log("RabbitMQ started");

    await channel.assertExchange("ecommerce.events", "topic", {
        durable: true,
    });
    const queue = await channel.assertQueue("inventory.queue", {
        durable: true,
    });

    await channel.bindQueue(queue.queue, "ecommerce.events", "order.created");
    // await channel.bindQueue(queue.queue, "ecommerce.events", "inventory.release");

    channel.consume(queue.queue, (message) => {
        if (!message) return;

        const event = JSON.parse(message.content.toString());

        console.log(event);

        channel.publish(
            "ecommerce.events",
            "inventory.failed",
            Buffer.from(JSON.stringify(event)),
        );

        channel.ack(message);
    });
}

export default startMQ;
