import express, { RequestHandler } from "express";
import {
  subscribe,
  unsubscribe,
  getAll,
  sendNewsletter,
} from "../controllers/newsletterController";

const newsletterRouter = express.Router();

// Explicitly type the handlers to avoid type mismatch
newsletterRouter.post("/subscribe", subscribe as RequestHandler);
newsletterRouter.post("/unsubscribe", unsubscribe as RequestHandler);
newsletterRouter.get("/", getAll as RequestHandler);
newsletterRouter.post("/send", sendNewsletter as RequestHandler);

export default newsletterRouter;