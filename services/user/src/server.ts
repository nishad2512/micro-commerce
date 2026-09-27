import "dotenv/config";
import connectDB from "./config/db.js";
import grpc, { type ServiceClientConstructor } from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import startMQ from "./events/rabbitmq.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.routes.js";
import { GrpcController } from "./controllers/grpc.controller.js";
import { UserRepo } from "./repositories/user.repository.js";
import { UserService as service } from "./services/user.service.js";
import { errorHandler } from "./middlewares/error.middleware.js";

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
app.use(cookieParser());
app.use(cors({ origin: process.env.FRONTEND_URL?.split(",") ?? ["http://localhost:5173"], credentials: true }));

app.get("/health", (_req, res) => res.status(200).json({ success: true, data: { status: "ok" } }));
app.get("/ready", (_req, res) => res.status(200).json({ success: true, data: { ready: mongoose.connection.readyState === 1 } }));

app.use("/", authRoutes);
app.use(errorHandler);

function startServer() {
    app.listen(PORT, () => {
        console.log(`User service [api] running on port ${PORT}`);
    });

    const server = new grpc.Server();

    const repo = new UserRepo();
    const serv = new service(repo);
    const controller = new GrpcController(serv);

    server.addService(UserService.service, { GetUser: controller.me.bind(controller), CreateUser: controller.create.bind(controller) });
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
