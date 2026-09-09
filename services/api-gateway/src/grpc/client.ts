import grpc, { type ServiceClientConstructor } from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";

// grpc client

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const loaderOptions = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
};

function createGrpcClient(
    protoPath: string,
    packageAndService: string,
    address: string,
) {
    const packageDefinition = protoLoader.loadSync(
        path.join(__dirname, protoPath),
        loaderOptions,
    );
    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

    const ClientConstructor = packageAndService
        .split(".")
        .reduce((obj: any, key: string) => {
            return obj && obj[key];
        }, protoDescriptor as any) as ServiceClientConstructor;

    if (!ClientConstructor || typeof ClientConstructor !== "function") {
        throw new Error(
            `Could not find service definition constructor for ${packageAndService}`,
        );
    }

    return new ClientConstructor(address, grpc.credentials.createInsecure());
}

export default createGrpcClient