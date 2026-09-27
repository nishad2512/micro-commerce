import type { IUserServ } from "../interfaces/serv.interface.js";
import grpc from "@grpc/grpc-js";

export class GrpcController {
    constructor(private serv: IUserServ) {}

    public async me(call: any, callback: any) {
        try {
            const result = await this.serv.userDetails(call.request.userId);

            callback(null, { userId: result.id, name: result.name, email: result.email, role: result.role });
        } catch (err: any) {
            console.error(err.message);
            callback({
                code: grpc.status.UNAUTHENTICATED,
                message: err.message || "User identification failed",
            });
        }
    }

    public async create(call: { request: { name: string; email: string; password: string } }, callback: (error: Error | null, response?: { token: string; message: string }) => void) {
        try {
            const result = await this.serv.registerUser(call.request);
            callback(null, { token: result.accessToken, message: "Account created" });
        } catch (error) {
            callback(error instanceof Error ? error : new Error("Unable to create user"));
        }
    }
}

