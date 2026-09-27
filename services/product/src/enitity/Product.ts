import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

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

    @Column({ type: "numeric", precision: 12, scale: 2, transformer: { to: (value: number) => value, from: (value: string) => Number(value) } })
    price!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
