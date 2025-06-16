// controllers/colorController.ts
import { Request, Response } from "express";
import Color from "../models/colorSchema";
 

// Neue Farbe erstellen
export const createColor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body; // Example: expecting a color name
    if (!name) {
      res.status(400).json({ message: "Color name is required" });
      return;
    }
    // Replace with your actual logic (e.g., save to database)
    res.status(201).json({ message: `Color ${name} created successfully` });
  } catch (error) {
    res.status(500).json({ message: "Error creating color", error });
  }
};

// Alle Farben abrufen
export const getAllColors = async (req: Request, res: Response) => {
  try {
    const colors = await Color.find();
    res.status(200).json(colors);
  } catch (error) {
    console.error("Fehler beim Abrufen der Farben:", error);
    res.status(500).json({ message: "Serverfehler beim Abrufen der Farben." });
  }
};
