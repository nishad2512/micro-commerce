import { z } from "zod";

export const RegisterSchema = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.email().trim().toLowerCase(),
    password: z.string().min(8).max(128),
});

export const LoginSchema = z.object({
    email: z.email().trim().toLowerCase(),
    password: z.string().min(1).max(128),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
