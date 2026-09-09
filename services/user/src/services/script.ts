import connectDB from "../config/db.js";
import { Wallet } from "../models/User.js";

await connectDB();

const data = { orderId: 11 };

const wallet = await Wallet.findOneAndUpdate(
    {
        userId: "6aa0f5d9e1e94e87e3bb69bf",
    },
    {
        $inc: { balance: 0 },
        $set: {
            "transactions.$[elem].status": "REFUNDED",
        },
    },
    {
        new: true,
        arrayFilters: [
            {
                "elem.orderId": data.orderId,
                "elem.status": "SUCCESS",
            },
        ],
    },
);

console.log(wallet);
