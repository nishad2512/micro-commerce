import "reflect-metadata";
import { DataSource, Repository } from "typeorm";
import { Product } from "../enitity/Product";

const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "123",
    database: "saga_product",
    synchronize: true,
    logging: false,
    entities: [Product],
    migrations: [],
    subscribers: [],
});

let prod: Repository<Product>;

const startORM = async () => {
    const res = await AppDataSource.initialize();
    console.log("PostgreSQL running in Product Service");
    prod = res.getRepository(Product);
};

export { startORM, prod };