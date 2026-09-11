import "reflect-metadata";
import { DataSource, Repository } from "typeorm";
import { Product } from "../enitity/Product.js";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "postgres",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "123",
    database: process.env.DB_NAME || "saga_product",
    synchronize: true,
    logging: false,
    entities: [Product],
    migrations: [],
    subscribers: [],
});

export const getProductRepository = (): Repository<Product> => {
    if (!AppDataSource.isInitialized) {
        throw new Error("Database has not been initialized yet!");
    }
    return AppDataSource.getRepository(Product);
};

export const startORM = async () => {
    try {
        await AppDataSource.initialize();
        console.log("PostgreSQL connected successfully in Product Service");
    } catch (error) {
        console.error("Error during PostgreSQL initialization:", error);
        process.exit(1);
    }
};
