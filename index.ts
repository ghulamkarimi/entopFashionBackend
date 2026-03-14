import express from "express";
import dotenv from "dotenv";
import { dbConnect } from "./config/dbConnect";
import userRouter from "./routers/userRouter";
import cors from "cors";
import cookieParser from "cookie-parser";
import categoryRouter from "./routers/categoryRouter";
import orderRouter from "./routers/orderRouter";
import genderRouter from "./routers/genderRouter";
import productRouter from "./routers/productRouter";
import newsletterRouter from "./routers/newsletterRouter";
import colorRouter from "./routers/colorRouter";
import adminRouter from "./routers/adminRouter";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);


dotenv.config();

const startServer = async () => {
  await dbConnect();

  const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/category", categoryRouter);
app.use("/api/order", orderRouter);
app.use("/api/genders", genderRouter);
app.use("/api/products", productRouter);
app.use("/api/color",colorRouter);
app.use("/api/newsletter", newsletterRouter);

  const PORT = process.env.PORT || 7004;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();