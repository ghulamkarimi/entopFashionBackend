import express, { RequestHandler } from "express";
import {
  subscribe,
  unsubscribe,
  getAll,
  sendNewsletter,
  uploadNewsletterImage,
} from "../controllers/newsletterController";
import upload from "../middleware/upload";

const newsletterRouter = express.Router();

newsletterRouter.post("/subscribe", subscribe as RequestHandler);
newsletterRouter.post("/unsubscribe", unsubscribe as RequestHandler);
newsletterRouter.get("/", getAll as RequestHandler);
newsletterRouter.post("/send", sendNewsletter as RequestHandler);
newsletterRouter.post(
  "/upload-image",
  upload.single("image"),
  uploadNewsletterImage as RequestHandler,
);

export default newsletterRouter;
