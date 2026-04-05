import asynchandler from "express-async-handler";
import { Request, Response } from "express";
import Category from "../models/categorySchema";


export const createCategory = asynchandler(async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. Prüfen, ob user Admin ist
        if (!req.user?.isAdmin) {
            res.status(403).json({ message: "Nur Admins dürfen Kategorien erstellen" });
            return;
        }

        // 2. Daten aus dem Request holen
        const { name, gender } = req.body;

        // 3. Neue Kategorie anlegen
        const newCategory = new Category({
            name,
            gender
            // Optional: createdBy: req.user.userId
        });

        await newCategory.save();

        res.status(201).json({ message: "Kategorie erstellt", category: newCategory });
    } catch (error) {
        res.status(500).json({ message: "Fehler beim Erstellen der Kategorie", error });
    }
});


export const deleteCategory = asynchandler(async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.isAdmin) {
        res.status(403).json({ message: "Nur Admins dürfen Kategorien löschen" });
        return;
      }
  
      const category = await Category.findById(req.params.id);
  
      if (!category) {
        res.status(404).json({ message: "Kategorie nicht gefunden" });
        return;
      }
  
      await category.deleteOne();
  
      res.status(200).json({ message: "Kategorie gelöscht" });
    } catch (error) {
      res.status(500).json({ message: "Fehler beim Löschen der Kategorie", error });
    }
  });

  
  export const updateCategory = asynchandler(async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.isAdmin) {
        res.status(403).json({ message: "Nur Admins dürfen Kategorien bearbeiten" });
        return;
      }
  
      const { name, gender } = req.body;
      const category = await Category.findById(req.params.id);
  
      if (!category) {
        res.status(404).json({ message: "Kategorie nicht gefunden" });
        return;
      }
  
      category.name = name || category.name;
      category.gender= gender || category.gender
  
      await category.save();
  
      res.status(200).json({ message: "Kategorie aktualisiert", category });
    } catch (error) {
      res.status(500).json({ message: "Fehler beim Bearbeiten der Kategorie", error });
    }
  });

  
export const getCategories = asynchandler(async (req: Request, res: Response): Promise<void> => {
    try {
        const categories = await Category.find();
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: "Fehler beim Abrufen der Kategorien", error });
    }
});
