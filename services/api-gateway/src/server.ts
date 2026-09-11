import express from "express";
import createGrpcClient from "./grpc/client.js";

const app = express();
const PORT = process.env.PORT || 3000;

// grpc client

const orderClient: any = createGrpcClient(
    "proto/order.proto",
    "order.OrderService",
    "order-service:50051",
);

const userClient: any = createGrpcClient(
    "proto/user.proto",
    "user.UserService",
    "user-service:50052",
);

const prodClient: any = createGrpcClient(
    "proto/product.proto",
    "product.ProductService",
    "product-service:50053",
);

// middlewares

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes

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

app.post("/products", (req, res) => {
    const { title, description, quantity, price } = req.body;
    try {
        prodClient.CreateProduct({ title, description, quantity, price }, (err: any, result: any) => {
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

// server listen

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
