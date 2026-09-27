import { z } from "zod";

export const WalletTopUpSchema = z.object({
    amount: z
        .number()
        .finite()
        .positive()
        .max(10_000)
        .refine((amount) => Number.isInteger(amount * 100), {
            message: "Amount can have at most two decimal places",
        }),
});

export type WalletTopUpInput = z.infer<typeof WalletTopUpSchema>;
