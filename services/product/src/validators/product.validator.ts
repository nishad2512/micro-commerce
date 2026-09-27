import { z } from "zod";

export const CreateProductSchema = z.object({
    title: z.string().trim().min(2).max(160),
    description: z.string().trim().min(1).max(2_000),
    quantity: z.number().int().nonnegative(),
    price: z.number().finite().nonnegative().max(1_000_000),
});

export const ProductQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(24),
});
