import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import type { ServiceClientConstructor } from "@grpc/grpc-js";
import path from "path";
import startMQ from "./events/rabbitmq.js";
import express from "express";
import { CreateOrder } from "./controllers/order.controller.js";
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

// const dummy = {
//     success: true,
//     transactionResult: {
//         orderId: "1234",
//         userId: "5678",
//         total: 5600,
//         items: [
//             { prodId: "123", qnty: 4, price: 430 },
//             { prodId: "325", qnty: 2, price: 360 },
//             { prodId: "847", qnty: 6, price: 710 },
//         ],
//     },
// };

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/orders", orderRoutes);

function startServer() {
    app.listen(PORT, () => {
        console.log(`Order [api] running on port ${PORT}`);
    });

    const server = new grpc.Server();

    server.addService(OrderService.service, { CreateOrder });
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
