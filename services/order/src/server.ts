import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import type { ServiceClientConstructor } from "@grpc/grpc-js";
import path from "path";
import startMQ from "./events/rabbitmq.js";
import express from "express";
import cors from "cors";
import orderRoutes from "./routes/order.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";

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
app.use(cors({ origin: process.env.FRONTEND_URL?.split(",") ?? ["http://localhost:5173"], credentials: true }));
app.get("/health", (_req, res) => res.status(200).json({ success: true, data: { status: "ok" } }));
app.get("/ready", (_req, res) => res.status(200).json({ success: true, data: { ready: true } }));

app.use("/orders", orderRoutes);
app.use(errorHandler);

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
