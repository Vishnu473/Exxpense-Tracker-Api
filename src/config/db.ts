import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async(uri:string):Promise<void> => {
    try {
        await mongoose.connect(uri);
        console.log("✅ Mongo Database connected successfully");
    } catch (error) {
        console.log("❌Error connecting mongo database",error)
    }
}