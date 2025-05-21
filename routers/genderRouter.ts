import express from "express";
import { genderValues } from "../gender";

const genderRouter = express.Router();

genderRouter.get("/", (req, res) => {
    res.json(genderValues);
  });
  

export default genderRouter;