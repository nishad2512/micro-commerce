import express from "express";
import createGrpcClient from "./grpc/client.js";
import { verifyUser } from "./middlewares/auth.middleware.js";
import { createProxyMiddleware } from "http-proxy-middleware";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

const app = express();
const PORT = process.env.PORT || 3000;

const userProxy = createProxyMiddleware({
    target: "http://user-service:3001",
    changeOrigin: true,
    pathFilter: ["/api/auth", "/api/users"],
    pathRewrite: {
        "^/api": "",
    },
});

const orderProxy = createProxyMiddleware({
    target: "http://order-service:3002",
    changeOrigin: true,
    pathFilter: "/api/orders",
    pathRewrite: {
        "^/api": "",
    },
});

// const productProxy = createProxyMiddleware({
//     target: "http://product-service:3002",
//     changeOrigin: true,
//     pathFilter: "/api/products",
//     pathRewrite: {
//         "^/api": "",
//     },
// });

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: "draft-8",
    legacyHeaders: false,
});

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
app.use(globalLimiter);
app.use(morgan("tiny"));

// routes

app.post("/api/orders", verifyUser, (req: any, res: any) => {
    const { items } = req.body;
    const userId = req.user.id;
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

app.use(orderProxy);

app.post("/api/auth/register", (req, res) => {
    const { name, email, password } = req.body;
    try {
        userClient.CreateUser(
            { name, email, password },
            (err: any, result: any) => {
                if (err) {
                    return res
                        .status(400)
                        .json({ success: false, message: err.message });
                }
                console.log(result);
                res.status(200).json(result);
            },
        );
    } catch (err: any) {
        console.error(err.message);
    }
});

app.use(userProxy);

app.post("/api/products", (req, res) => {
    const { title, description, quantity, price } = req.body;
    try {
        prodClient.CreateProduct(
            { title, description, quantity, price },
            (err: any, result: any) => {
                if (err) {
                    return res
                        .status(400)
                        .json({ success: false, message: err.message });
                }
                console.log(result);
                res.status(200).json(result);
            },
        );
    } catch (err: any) {
        console.error(err.message);
    }
});

// app.use(productProxy);

// server listen

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
