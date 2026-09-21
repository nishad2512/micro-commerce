import prisma from "../lib/prisma.js";
import { Status } from "../generated/prisma/enums.js";

export const cancelOrder = async (orderId: number) => {
    try {
        await prisma.order.update({
            where: { orderId: orderId },
            data: { status: "CANCELLED" },
        });

        return { success: true };
    } catch (err: any) {
        console.error(err.message);
        return { success: false, message: err.message };
    }
};

export const createOrder = async (data: any) => {
    const transactionResult = await prisma.$transaction(async (tx) => {
        let orderTotal = 0;
        const itemsData = [];

        for (const item of data.items) {
            const itemSubtotal = item.price * item.quantity;
            orderTotal += itemSubtotal;

            itemsData.push({
                prodId: parseInt(item.prodId),
                quantity: parseInt(item.quantity),
                price: parseFloat(item.price),
            });
        }

        const order = await tx.order.create({
            data: {
                userId: data.userId,
                items: {
                    create: itemsData,
                },
                total: orderTotal,
            },
        });

        return {
            orderId: order.orderId,
            userId: order.userId,
            total: order.total,
            items: itemsData,
        };
    });

    console.log(transactionResult);

    return { success: true, transactionResult };
};

export const getOrdersByUser = async (userId: string) => {
    const orders = await prisma.order.findMany({
        where: {
            userId: userId,
        },
        include: {
            items: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return orders;
};

export const getOrderById = async (orderId: string, userId: string) => {
    const order = await prisma.order.findUnique({
        where: {
            orderId: parseInt(orderId),
            userId: userId,
        },
        include: {
            items: true,
        },
    });

    return order;
};

export const updateOrderStatus = async (orderId: string, newStatus: Status) => {
    const updatedOrder = await prisma.order.update({
        where: {
            orderId: parseInt(orderId),
        },
        data: {
            status: newStatus,
        },
    });

    return updatedOrder;
};
