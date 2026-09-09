import prisma from "../lib/prisma.js";

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
    try {
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
    } catch (err: any) {
        console.error(err.message);
        return { success: false, message: err.message };
    }
};
