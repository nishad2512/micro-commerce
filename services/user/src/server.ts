import "dotenv/config";
import connectDB from "./config/db.js";
import grpc, { type ServiceClientConstructor } from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";
import startMQ from "./events/rabbitmq.js";
import { createUser } from "./services/user.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageDefinition = protoLoader.loadSync(
    path.join(__dirname, "../../../proto/user.proto"),
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

function startServer() {
    const server = new grpc.Server();

    server.addService(UserService.service, { CreateUser: createUser });
    server.bindAsync(
        "0.0.0.0:50052",
        grpc.ServerCredentials.createInsecure(),
        (err, port) => {
            if (err) {
                console.error(err.message);
                return;
            }

            console.log(`User service running on port ${port}`);
        },
    );
}

startServer();
