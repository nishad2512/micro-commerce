import "reflect-metadata";
import startMQ from "./events/rabbitmq";
import grpc, { type ServiceClientConstructor } from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";
import { startORM, prod } from "./config/db";
import { Product } from "./enitity/Product";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loaderOptions = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
};
const packageDefinition = protoLoader.loadSync(
    path.join(__dirname, "../../../proto/product.proto"),
    loaderOptions,
);
const proto = grpc.loadPackageDefinition(packageDefinition);
const ProductService = (proto.product as any)
    .ProductService as ServiceClientConstructor;

await startMQ();
await startORM();

async function CreateProduct(call: any, callback: any) {
    const { title, description, quantity, price } = call.request;

    try {
        const product = new Product();
        product.title = title;
        product.description = description;
        product.quantity = quantity;
        product.price = price;
        const newPrd = await prod.save(product);
        console.log("Product created successfully");
        console.log(newPrd);

        callback(null, { ...newPrd });
    } catch (err: any) {
        console.error(err.message);
        callback({ code: grpc.status.CANCELLED, message: err.message });
    }
}

function startServer() {
    const server = new grpc.Server();
    server.addService(ProductService.service, { CreateProduct });
    server.bindAsync(
        "0.0.0.0:50053",
        grpc.ServerCredentials.createInsecure(),
        async (err, port) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(`Product Service running on port ${port}`);
        },
    );
}

startServer();
