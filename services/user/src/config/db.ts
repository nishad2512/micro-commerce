import mongoose from "mongoose";

async function connectDB() {
    try {
        const conn = await mongoose.connect(
            process.env.MONGO_URI ||
                "mongodb://mongo:27017/saga_user",
            { replicaSet: "rs0", directConnection: true },
        );

        console.log(`Mongodb connected: ${conn.connection.host}`);
    } catch (err: any) {
        console.error(`Database connection error ${err.message}`);
        process.exit(1);
    }
}

export default connectDB;
