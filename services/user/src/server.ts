import "dotenv/config";
import connectDB from "./config/db.js";
import grpc, { type ServiceClientConstructor } from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import startMQ from "./events/rabbitmq.js";
import { createUser, meRPC } from "./services/user.service.js";
import express from "express";
import authRoutes from "./routes/auth.routes.js";

const app = express();
const PORT = process.env.PORT || 3001;

const packageDefinition = protoLoader.loadSync(
    path.join(process.cwd(), "proto/user.proto"),
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
    },
);
const proto = grpc.loadPackageDefinition(packageDefinition);
const UserService = (proto.user as any).UserService as ServiceClientConstructor;

await connectDB();
await startMQ();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", authRoutes);

function startServer() {
    app.listen(PORT, () => {
        console.log(`User service [api] running on port ${PORT}`);
    });

    const server = new grpc.Server();

    server.addService(UserService.service, { CreateUser: createUser, GetUser: meRPC });
    server.bindAsync(
        "0.0.0.0:50052",
        grpc.ServerCredentials.createInsecure(),
        (err, port) => {
            if (err) {
                console.error(err.message);
                return;
            }

            console.log(`User service [grpc] running on port ${port}`);
        },
    );
}

startServer();
