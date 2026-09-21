import { getChannel } from "../events/rabbitmq.js";
import { Status } from "../generated/prisma/enums.js";
import createGrpcClient from "../grpc/client.js";
import {
    createOrder,
    getOrderById,
    getOrdersByUser,
    updateOrderStatus,
} from "../services/order.service.js";
import grpc from "@grpc/grpc-js";

const userClient: any = createGrpcClient(
    "proto/user.proto",
    "user.UserService",
    "user-service:50052",
);

export async function CreateOrder(call: any, callback: any) {
    try {
        const res: {
            success: boolean;
            transactionResult?: any;
            message?: string;
        } = await createOrder(call.request);

        const channel = getChannel();

        channel.publish(
            "ecommerce.events",
            "order.created",
            Buffer.from(JSON.stringify(res.transactionResult)),
            { persistent: true },
        );

        callback(null, { ...res.transactionResult });
    } catch (err: any) {
        console.error(err.message);
        callback({
            code: grpc.status.ABORTED,
            message: err.message,
        });
    }
}

export const getOrders = async (req: any, res: any) => {
    try {
        const result = await getOrdersByUser(req.user.id);

        res.status(200).json({ orders: result });
    } catch (err: any) {
        console.error(err.message);
        res.status(400).json({
            success: false,
            message: err.message || "Getting orders failed",
        });
    }
};

export const getOrder = async (req: any, res: any) => {
    try {
        const order = await getOrderById(req.params.id, req.user.id);
        if (!order) {
            return res
                .status(403)
                .json({ success: false, message: "Invalid order" });
        }

        res.status(200).json(order);
    } catch (err: any) {
        console.error(err.message);
        res.status(400).json({
            success: false,
            message: err.message || "Getting orders failed",
        });
    }
};

export const updateOrder = async (req: any, res: any) => {
    try {
        await new Promise<void>((resolve, reject) => {
            userClient.GetUser(
                { userId: req.user.id },
                (err: any, result: any) => {
                    if (err) {
                        return reject({ status: 400, message: err.message });
                    }

                    console.log(result);
                    if (result.role !== "admin") {
                        return reject({
                            status: 403,
                            message: "Unauthorized User",
                        });
                    }

                    resolve();
                },
            );
        });

        const status = req.body.status;
        const validStatuses = Object.values(Status) as string[];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
            });
        }

        const result = await updateOrderStatus(req.params.id, status as Status);

        return res.status(200).json(result);
    } catch (err: any) {
        console.error(err.message || err);

        if (err.status) {
            return res
                .status(err.status)
                .json({ success: false, message: err.message });
        }

        return res.status(400).json({
            success: false,
            message: err.message || "Order updation failed",
        });
    }
};
