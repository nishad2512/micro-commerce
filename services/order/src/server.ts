import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import type { ServiceClientConstructor } from "@grpc/grpc-js";
import path from "path";
import startMQ from "./events/rabbitmq.js";
import express from "express";
import orderRoutes from "./routes/order.routes.js";

const app = express();
const PORT = process.env.PORT || 3002;

const packageDefinition = protoLoader.loadSync(
    path.join(process.cwd(), "proto/order.proto"),
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
    },
);

const proto = grpc.loadPackageDefinition(packageDefinition);

const OrderService = (proto.order as any)
    .OrderService as ServiceClientConstructor;

// RabbitMQ connection

await startMQ();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/orders", orderRoutes);

function startServer() {
    app.listen(PORT, () => {
        console.log(`Order [api] running on port ${PORT}`);
    });

    const server = new grpc.Server();

    server.bindAsync(
        "0.0.0.0:50051",
        grpc.ServerCredentials.createInsecure(),
        (err, port) => {
            if (err) {
                console.error(err);
                return;
            }

            console.log(`Order [gRPC] running on port ${port}`);
        },
    );
}

startServer();
