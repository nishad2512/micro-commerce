import { z } from "zod";

export const CreateOrderSchema = z.object({
    items: z
        .array(
            z.object({
                prodId: z.coerce.number().int().positive(),
                quantity: z.coerce.number().int().positive().max(100),
            }),
        )
        .min(1)
        .max(50),
});
export const UpdateOrderSchema = z.object({
    status: z.enum(["PENDING", "CANCELLED", "CONFIRMED", "SHIPPED"]),
});
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
