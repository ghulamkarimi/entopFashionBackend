// routes/colorRoutes.ts
import express, { RequestHandler } from "express";
import { createColor, getAllColors } from "../controllers/colorController";

const colorRouter = express.Router();

colorRouter.post("/", createColor as RequestHandler);    // ✅ korrekt
colorRouter.get("/", getAllColors);     // ✅ korrekt

export default colorRouter;
