import prisma from "../lib/prisma.js";
import { Status } from "../generated/prisma/enums.js";
import createGrpcClient from "../grpc/client.js";
import { DownstreamError, NotFoundError } from "../errors/app-error.js";
import type { CreateOrderInput } from "../validators/order.validator.js";

interface ProductResponse { productId: number; price: number; quantity: number; }
interface ProductClient { GetProduct(request: { productId: number }, callback: (error: Error | null, response: ProductResponse) => void): void; }
const productClient = createGrpcClient("proto/product.proto", "product.ProductService", process.env.PRODUCT_GRPC_URL ?? "product-service:50053") as unknown as ProductClient;

const getProduct = (productId: number): Promise<ProductResponse> => new Promise((resolve, reject) => {
    productClient.GetProduct({ productId }, (error, product) => error ? reject(new DownstreamError(`Product ${productId} is unavailable`)) : resolve(product));
});

export interface OrderEvent { orderId: number; userId: string; total: number; items: Array<{ prodId: number; quantity: number; price: number }>; }

export const cancelOrder = async (orderId: number) => {
    const result = await prisma.order.updateMany({ where: { orderId, status: { not: "CANCELLED" } }, data: { status: "CANCELLED" } });
    return { success: result.count === 1 };
};

export const createOrder = async (userId: string, data: CreateOrderInput): Promise<OrderEvent> => {
    const requestedQuantities = new Map<number, number>();
    for (const item of data.items) requestedQuantities.set(item.prodId, (requestedQuantities.get(item.prodId) ?? 0) + item.quantity);
    const items = await Promise.all([...requestedQuantities.entries()].map(async ([prodId, quantity]) => {
        const product = await getProduct(prodId);
        if (product.quantity < quantity) throw new DownstreamError(`Insufficient inventory for product ${prodId}`);
        return { prodId, quantity, price: product.price };
    }));
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = await prisma.order.create({ data: { userId, total, items: { create: items } } });
    return { orderId: order.orderId, userId, total, items };
};

export const getOrdersByUser = (userId: string) => prisma.order.findMany({ where: { userId }, include: { items: true }, orderBy: { createdAt: "desc" } });

export const getAllOrders = () => prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" } });

export const getOrderById = async (orderId: number, userId?: string) => {
    const order = await prisma.order.findFirst({ where: { orderId, ...(userId ? { userId } : {}) }, include: { items: true } });
    if (!order) throw new NotFoundError("Order not found");
    return order;
};

export const updateOrderStatus = (orderId: number, newStatus: Status) => prisma.order.update({ where: { orderId }, data: { status: newStatus } });
