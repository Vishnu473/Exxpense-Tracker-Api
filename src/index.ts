import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { connectDB } from "./config/db";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.route";
import categoryRoutes from "./routes/category.route";
import transactionRoutes from "./routes/transaction.route";
import savingRoutes from "./routes/saving.route";
import walletRoutes from "./routes/wallet.route";

dotenv.config();

const corsOptions={
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
  credentials: true,
}
const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors(corsOptions));

app.use('/api/v1/user', userRoutes);
app.use('/api/v1/category', categoryRoutes);
app.use('/api/v1/transaction', transactionRoutes);
app.use('/api/v1/saving', savingRoutes);
app.use('/api/v1/wallet', walletRoutes);

app.get('/api/v1/check',async(req:Request,res:Response) => {
    res.json("✅ Server is running and is healthy")
});

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  connectDB(process.env.MONGO_URI as string);
});