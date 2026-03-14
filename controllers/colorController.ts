// controllers/colorController.ts
import { Request, Response } from "express";
import Color from "../models/colorSchema";
 

// Neue Farbe erstellen


export const createColor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, hexCode } = req.body;

    if (!name || !hexCode) {
      res.status(400).json({ message: "Name und Hex-Code sind erforderlich" });
      return;
    }

    // Prüfen, ob die Farbe bereits existiert
    const existingColor = await Color.findOne({ hexCode: hexCode.toLowerCase() });
    if (existingColor) {
      res.status(409).json({ message: "Farbe mit diesem Hex-Code existiert bereits" });
      return;
    }

    const newColor = new Color({ name, hexCode: hexCode.toLowerCase() });
    await newColor.save();

    res.status(201).json({ message: `Farbe ${name} erfolgreich erstellt`, color: newColor });
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Erstellen der Farbe", error });
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
