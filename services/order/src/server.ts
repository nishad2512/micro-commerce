import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import type { ServiceClientConstructor } from "@grpc/grpc-js";
import path from "path";
import { fileURLToPath } from "url";
import startMQ from "./events/rabbitmq.js";
import { createOrder } from "./services/order.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageDefinition = protoLoader.loadSync(
    path.join(__dirname, "../../../proto/order.proto"),
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

const channel = await startMQ();

const dummy = {
    success: true,
    transactionResult: {
        orderId: "1234",
        userId: "5678",
        total: 5600,
        items: [
            { prodId: "123", qnty: 4, price: 430 },
            { prodId: "325", qnty: 2, price: 360 },
            { prodId: "847", qnty: 6, price: 710 },
        ],
    },
};

async function CreateOrder(call: any, callback: any) {
    const res: { success: boolean; transactionResult?: any; message?: string } =
       // dummy;
     await createOrder(call.request);

    if (res.success) {
        channel.publish(
            "ecommerce.events",
            "order.created",
            Buffer.from(JSON.stringify(res.transactionResult)),
            { persistent: true },
        );

        callback(null, { ...res.transactionResult });
    } else {
        console.error(res.message);
        callback({
            code: grpc.status.ABORTED,
            message: res.message,
        });
    }
}

function startServer() {
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

            console.log(`Order service running on port ${port}`);
        },
    );
}

startServer();
