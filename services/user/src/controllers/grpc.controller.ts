import type { IUserServ } from "../interfaces/serv.interface.js";
import { userDetails } from "../services/user.service.js";
import grpc from "@grpc/grpc-js";

export class GrpcController {
    constructor(private serv: IUserServ) {}

    public async me(call: any, callback: any) {
        try {
            const result = await this.serv.userDetails(call.request.userId);

            callback(null, result);
        } catch (err: any) {
            console.error(err.message);
            callback({
                code: grpc.status.UNAUTHENTICATED,
                message: err.message || "User identification failed",
            });
        }
    }
}

export const meRPC = async (call: any, callback: any) => {
    try {
        const result = await userDetails(call.request.userId);

        callback(null, result);
    } catch (err: any) {
        console.error(err.message);
        callback({
            code: grpc.status.UNAUTHENTICATED,
            message: err.message || "User identification failed",
        });
    }
};
