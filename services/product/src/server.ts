import "dotenv/config";
import "reflect-metadata";
import express, {
    type NextFunction,
    type Request,
    type Response,
} from "express";
import jwt from "jsonwebtoken";
import startMQ from "./events/rabbitmq.js";
import grpc, { type ServiceClientConstructor } from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { getProductRepository, startORM } from "./config/db.js";
import { Product } from "./enitity/Product.js";
import {
    CreateProductSchema,
    ProductQuerySchema,
} from "./validators/product.validator.js";

type ProductInput = {
    title: string;
    description: string;
    quantity: number;
    price: number;
};
const loaderOptions = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
};
const packageDefinition = protoLoader.loadSync(
    path.join(process.cwd(), "proto/product.proto"),
    loaderOptions,
);
const proto = grpc.loadPackageDefinition(packageDefinition);
const ProductService = (
    proto.product as { ProductService: ServiceClientConstructor }
).ProductService;
const app = express();
const PORT = Number(process.env.PORT ?? 3003);

const createProduct = async (input: ProductInput): Promise<Product> => {
    const product = getProductRepository().create(input);
    return getProductRepository().save(product);
};
const listProducts = async (page: number, limit: number) => {
    const [products, total] = await getProductRepository().findAndCount({
        order: { createdAt: "DESC" },
        skip: (page - 1) * limit,
        take: limit,
    });
    return { products, total, page, limit };
};
const productId = (value: string): number => {
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id <= 0)
        throw new Error("Product id must be a positive integer");
    return id;
};
const requireAdmin = (
    req: Request,
    _res: Response,
    next: NextFunction,
): void => {
    try {
        const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
        const secret = process.env.JWT_ACCESS_SECRET;
        if (!token || !secret)
            return void next(
                Object.assign(new Error("Authentication required"), {
                    statusCode: 401,
                }),
            );
        const payload = jwt.verify(token, secret);
        if (typeof payload === "string" || payload.role !== "admin")
            return void next(
                Object.assign(new Error("Administrator access required"), {
                    statusCode: 403,
                }),
            );
        next();
    } catch {
        next(
            Object.assign(new Error("Invalid access token"), {
                statusCode: 401,
            }),
        );
    }
};

await startORM();
await startMQ();
app.use(express.json({ limit: "100kb" }));
app.get("/health", (_req, res) =>
    res.status(200).json({ success: true, data: { status: "ok" } }),
);
app.get("/ready", (_req, res) =>
    res.status(200).json({ success: true, data: { ready: true } }),
);
app.get("/products", async (req, res, next) => {
    try {
        const { page, limit } = ProductQuerySchema.parse(req.query);
        res.status(200).json({
            success: true,
            data: await listProducts(page, limit),
        });
    } catch (error) {
        next(error);
    }
});
app.get("/products/:id", async (req, res, next) => {
    try {
        const product = await getProductRepository().findOneBy({
            productId: productId(req.params.id),
        });
        if (!product)
            return void res
                .status(404)
                .json({ success: false, message: "Product not found" });
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        next(error);
    }
});
app.post("/products", requireAdmin, async (req, res, next) => {
    try {
        res.status(201).json({
            success: true,
            data: await createProduct(CreateProductSchema.parse(req.body)),
        });
    } catch (error) {
        next(error);
    }
});
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status =
        typeof error === "object" &&
        error !== null &&
        "statusCode" in error &&
        typeof error.statusCode === "number"
            ? error.statusCode
            : 422;
    const message = error instanceof Error ? error.message : "Invalid request";
    res.status(status).json({ success: false, message });
});

async function CreateProduct(
    call: { request: ProductInput },
    callback: (error: Error | null, response?: Product) => void,
): Promise<void> {
    try {
        callback(
            null,
            await createProduct(CreateProductSchema.parse(call.request)),
        );
    } catch (error) {
        callback(
            error instanceof Error
                ? error
                : new Error("Unable to create product"),
        );
    }
}
async function GetProduct(
    call: { request: { productId: number } },
    callback: (error: Error | null, response?: Product) => void,
): Promise<void> {
    try {
        const product = await getProductRepository().findOneBy({
            productId: call.request.productId,
        });
        if (!product)
            return callback(
                Object.assign(new Error("Product not found"), {
                    code: grpc.status.NOT_FOUND,
                }),
            );
        callback(null, product);
    } catch (error) {
        callback(
            error instanceof Error
                ? error
                : new Error("Unable to fetch product"),
        );
    }
}
async function ListProducts(
    call: { request: { page: number; limit: number } },
    callback: (
        error: Error | null,
        response?: { products: Product[]; total: number },
    ) => void,
): Promise<void> {
    try {
        const result = await listProducts(
            Math.max(call.request.page || 1, 1),
            Math.min(Math.max(call.request.limit || 24, 1), 100),
        );
        callback(null, result);
    } catch (error) {
        callback(
            error instanceof Error
                ? error
                : new Error("Unable to list products"),
        );
    }
}
const grpcServer = new grpc.Server();
grpcServer.addService(ProductService.service, {
    CreateProduct,
    GetProduct,
    ListProducts,
});
grpcServer.bindAsync(
    "0.0.0.0:50053",
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
        if (error) throw error;
        console.log(`Product service gRPC listening on ${port}`);
    },
);
app.listen(PORT, () =>
    console.log(`Product service HTTP listening on ${PORT}`),
);
