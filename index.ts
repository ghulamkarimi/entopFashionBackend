import express from "express";
import dotenv from "dotenv";
dotenv.config();
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
import offerRouter from "./routers/offerRouter";
import dns from "node:dns";
import path from "path";

dns.setServers(["8.8.8.8", "8.8.4.4"]);



const startServer = async () => {
  await dbConnect();

  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173"
  ];

  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) === -1) {
          const msg =
            "The CORS policy for this site does not allow access from the specified Origin.";
          return callback(new Error(msg), false);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    message: "Server is healthy"
  });
});

  // WICHTIG: uploads-Ordner öffentlich machen
  app.use("/uploads", express.static(path.resolve("uploads")));

  app.use("/api/user", userRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/category", categoryRouter);
  app.use("/api/order", orderRouter);
  app.use("/api/genders", genderRouter);
  app.use("/api/products", productRouter);
  app.use("/api/offers", offerRouter);
  app.use("/api/color", colorRouter);
  app.use("/api/newsletter", newsletterRouter);

  const PORT = process.env.PORT || 7004;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();