import express from "express";
import grpc, { type ServiceClientConstructor } from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";

// grpc client

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const loaderOptions = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
};

function createGrpcClient(
    protoPath: string,
    packageAndService: string,
    address: string,
) {
    const packageDefinition = protoLoader.loadSync(
        path.join(__dirname, protoPath),
        loaderOptions,
    );
    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

    const ClientConstructor = packageAndService
        .split(".")
        .reduce((obj: any, key: string) => {
            return obj && obj[key];
        }, protoDescriptor as any) as ServiceClientConstructor;

    if (!ClientConstructor || typeof ClientConstructor !== "function") {
        throw new Error(
            `Could not find service definition constructor for ${packageAndService}`,
        );
    }

    return new ClientConstructor(address, grpc.credentials.createInsecure());
}

const orderClient: any = createGrpcClient(
    "../../../proto/order.proto",
    "order.OrderService",
    "localhost:50051",
);

const userClient: any = createGrpcClient(
    "../../../proto/user.proto",
    "user.UserService",
    "localhost:50052",
);

// express

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/orders", (req, res) => {
    const { userId, items } = req.body;
    try {
        orderClient.CreateOrder({ userId, items }, (err: any, result: any) => {
            if (err) {
                return res
                    .status(400)
                    .json({ success: false, message: err.message });
            }
            console.log(result);
            res.status(200).json(result);
        });
    } catch (err: any) {
        console.error(err.message);
    }
});

app.post("/users", (req, res) => {
    const { name, email } = req.body;
    try {
        userClient.CreateUser({ name, email }, (err: any, result: any) => {
            if (err) {
                return res
                    .status(400)
                    .json({ success: false, message: err.message });
            }
            console.log(result);
            res.status(200).json(result);
        });
    } catch (err: any) {
        console.error(err.message);
    }
});

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
