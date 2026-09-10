import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    productId!: number;

    @Column({ type: "text" })
    title!: string;

    @Column({ type: "text" })
    description!: string;

    @Column({ type: "integer" })
    quantity!: number;

    @Column({ type: "numeric" })
    price!: number;
}