import asynchandler from "express-async-handler";
import { Request, Response } from "express";
import Category from "../models/categorySchema";


export const createCategory = asynchandler(async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("BODY:", req.body);
    console.log("USER:", req.user);

    const { name, gender } = req.body;

    const newCategory = new Category({
      name,
      gender,
    });

    await newCategory.save();

    res.status(201).json({ message: "Kategorie erstellt", category: newCategory });
  } catch (error) {
    console.error("CREATE CATEGORY ERROR:", error);
    res.status(500).json({
      message: "Fehler beim Erstellen der Kategorie",
      error: error instanceof Error ? error.message : error,
    });
  }
});


export const deleteCategory = asynchandler(async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("DELETE CATEGORY PARAMS:", req.params);
    console.log("DELETE CATEGORY USER:", req.user);

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
    console.error("DELETE CATEGORY ERROR:", error);
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
