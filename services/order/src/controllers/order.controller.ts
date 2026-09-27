import type { NextFunction, Request, Response } from "express";
import { getChannel } from "../events/rabbitmq.js";
import { Status } from "../generated/prisma/enums.js";
import { createOrder, getAllOrders, getOrderById, getOrdersByUser, updateOrderStatus } from "../services/order.service.js";
import { CreateOrderSchema, UpdateOrderSchema } from "../validators/order.validator.js";
import { AuthorizationError } from "../errors/app-error.js";

const orderId = (value: string | string[] | undefined): number => {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error("Order id must be a positive integer");
    return parsed;
};

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const event = await createOrder(req.user!.sub, CreateOrderSchema.parse(req.body));
        getChannel().publish("ecommerce.events", "order.created", Buffer.from(JSON.stringify(event)), { persistent: true, contentType: "application/json", messageId: `order.created:${event.orderId}` });
        res.status(201).json({ success: true, message: "Order created", data: event });
    } catch (error) { next(error); }
};

export const getOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const orders = req.user!.role === "admin" ? await getAllOrders() : await getOrdersByUser(req.user!.sub);
        res.status(200).json({ success: true, data: orders });
    } catch (error) { next(error); }
};

export const getOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.role === "admin" ? undefined : req.user!.sub;
        res.status(200).json({ success: true, data: await getOrderById(orderId(req.params.id), userId) });
    } catch (error) { next(error); }
};

export const updateOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (req.user!.role !== "admin") throw new AuthorizationError();
        const { status } = UpdateOrderSchema.parse(req.body);
        res.status(200).json({ success: true, data: await updateOrderStatus(orderId(req.params.id), status as Status) });
    } catch (error) { next(error); }
};
