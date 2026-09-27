import express, {
    type NextFunction,
    type Request,
    type Response,
} from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

// 1. Tell Express to trust upstream headers (Crucial for Rate Limiting behind proxies)
app.set("trust proxy", 1);

// 2. Configure CORS Options explicitly
const corsOptions = {
    origin: process.env.FRONTEND_URL?.split(",") ?? ["http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

// 3. Apply CORS globally
app.use(cors(corsOptions));

// 4. Force respond 204 to PREFLIGHT (OPTIONS) requests immediately
// This prevents http-proxy-middleware from hijacking the preflight request
// app.options("*path", cors(corsOptions));

// 5. Global Middlewares
// app.use(express.json({ limit: "100kb" }));
app.use(morgan("tiny"));

app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 100,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        handler: (_req, res) =>
            res.status(429).json({
                success: false,
                message: "Too many requests. Please try again later.",
            }),
    }),
);

// 6. Base Routes
app.get("/health", (_req, res) =>
    res.status(200).json({ success: true, data: { status: "ok" } }),
);
app.get("/ready", (_req, res) =>
    res.status(200).json({ success: true, data: { ready: true } }),
);

// 7. Proxies (Note: corrected 'timeout' to 'connectTimeout' for v3.x compatibility)
app.use(
    createProxyMiddleware({
        target: process.env.USER_SERVICE_URL ?? "http://user-service:3001",
        pathFilter: ["/api/auth", "/api/users"],
        changeOrigin: true,
        pathRewrite: { "^/api": "" },
        proxyTimeout: 10_000,
        timeout: 10_000,
    }),
);

app.use(
    createProxyMiddleware({
        target:
            process.env.PRODUCT_SERVICE_URL ?? "http://product-service:3003",
        pathFilter: "/api/products",
        changeOrigin: true,
        pathRewrite: { "^/api": "" },
        proxyTimeout: 10_000,
        timeout: 10_000,
    }),
);

app.use(
    createProxyMiddleware({
        target: process.env.ORDER_SERVICE_URL ?? "http://order-service:3002",
        pathFilter: "/api/orders",
        changeOrigin: true,
        pathRewrite: { "^/api": "" },
        proxyTimeout: 15_000,
        timeout: 15_000,
    }),
);

// 8. Error Handler
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Gateway error", error);
    res.status(502).json({
        success: false,
        message: "A downstream service is unavailable",
        error: { code: "BAD_GATEWAY" },
    });
});

app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
