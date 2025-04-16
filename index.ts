import express from "express";
import dotenv from "dotenv";
import { dbConnect } from "./config/dbConnect";
import userRouter from "./routers/userRouter";
import cors from "cors";
import cookieParser from "cookie-parser";
import categoryRouter from "./routers/categoryRouter";
import orderRouter from "./routers/orderRouter";


dotenv.config();
dbConnect()

const app = express()

app.use(express.json())
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:3000", // ersetze mit deinem echten Frontend
    credentials: true,
  }));
  
app.use("/api/user",userRouter)
app.use("/api/category",categoryRouter)
app.use("/api/order",orderRouter)

const PORT = process.env.PORT || 3000
app.listen(PORT , ()=>{
    console.log(`Server is running on port ${PORT}`)
})



