import { Request, Response } from "express";
import NewsletterSubscriber from "../models/newsletterSubscriberSchema";
import NewsletterCampaign from "../models/newsletterCampaignSchema";
import { sendEmail } from "../utils/sendEmail";
import { getBaseTemplate } from "../utils/emailTemplates";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

type NewsletterProduct = {
  title: string;
  description: string;
  image?: string;
  images?: string[];
};

// Hilfsfunktionen
const escapeHtml = (value: string = ""): string => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const getProductImage = (product: NewsletterProduct): string => {
  if (product.image && product.image.trim() !== "") return product.image;
  if (
    Array.isArray(product.images) &&
    product.images.length > 0 &&
    typeof product.images[0] === "string" &&
    product.images[0].trim() !== ""
  ) {
    return product.images[0];
  }
  return "";
};

// --- CONTROLLER ---

export const uploadNewsletterImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("uploadNewsletterImage erreicht");
    console.log("req.body.image:", req.body.image);

    if (!req.body.image) {
      res.status(400).json({ message: "Kein Newsletter-Bild verarbeitet." });
      return;
    }

    res.status(200).json({
      message: "Bild erfolgreich hochgeladen.",
      imageUrl: req.body.image,
    });
  } catch (error) {
    console.error("Fehler beim Hochladen des Bildes:", error);
    res.status(500).json({
      message: "Fehler beim Hochladen des Bildes.",
    });
  }
};
// POST /api/newsletter/subscribe
export const subscribe = async (req: Request, res: Response): Promise<void> => {
  const email = req.body?.email?.trim()?.toLowerCase();

  if (!email) {
    res.status(400).json({ message: "Bitte eine E-Mail-Adresse angeben." });
    return;
  }

  try {
    const existing = await NewsletterSubscriber.findOne({ email });

    if (existing) {
      if (existing.subscribed) {
        res.status(200).json({ message: "Diese E-Mail ist bereits abonniert." });
        return;
      }

      existing.subscribed = true;
      existing.unsubscribedAt = null as any; 
      await existing.save();
      res.status(200).json({ message: "Abo wurde wieder aktiviert." });
      return;
    }

    const newSubscriber = new NewsletterSubscriber({ email, subscribed: true });
    await newSubscriber.save();

    res.status(201).json({ message: "Erfolgreich abonniert." });
  } catch (error) {
    res.status(500).json({ message: "Ein Fehler ist aufgetreten.", error });
  }
};

// POST /api/newsletter/unsubscribe
export const unsubscribe = async (req: Request, res: Response): Promise<void> => {
  const email = req.body?.email?.trim()?.toLowerCase();

  if (!email) {
    res.status(400).json({ message: "E-Mail fehlt." });
    return;
  }

  try {
    // Wir konzentrieren uns nur auf die Newsletter-Collection
    const subscriber = await NewsletterSubscriber.findOneAndUpdate(
      { email },
      { subscribed: false, unsubscribedAt: new Date() },
      { new: true }
    );

    if (!subscriber) {
      res.status(404).json({ message: "E-Mail wurde nicht in unserer Liste gefunden." });
      return;
    }

    res.status(200).json({ message: "Erfolgreich abgemeldet." });
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Abmelden.", error });
  }
};

// GET /api/newsletter (Alle Abonnenten auflisten)
export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const subscribers = await NewsletterSubscriber.find().sort({ createdAt: -1 });
    res.status(200).json(subscribers);
  } catch (error) {
    res.status(500).json({ message: "Ein Fehler ist aufgetreten.", error });
  }
};

// POST /api/newsletter/send (Newsletter versenden)
export const sendNewsletter = async (req: Request, res: Response): Promise<void> => {
  const { subject, products } = req.body as { subject?: string; products?: NewsletterProduct[] };

  if (!subject?.trim()) {
    res.status(400).json({ message: "Bitte einen Betreff angeben." });
    return;
  }

  if (!Array.isArray(products) || products.length === 0) {
    res.status(400).json({ message: "Bitte mindestens ein Produkt angeben." });
    return;
  }

  const normalizedProducts = products
    .filter(p => p?.title?.trim() && p?.description?.trim())
    .map(p => ({
      title: p.title.trim(),
      description: p.description.trim(),
      image: getProductImage(p),
    }));

  if (normalizedProducts.length === 0) {
    res.status(400).json({ message: "Keine gültigen Produkte übergeben." });
    return;
  }

  try {
    const subscribers = await NewsletterSubscriber.find({ subscribed: true });

    if (subscribers.length === 0) {
      res.status(400).json({ message: "Keine Abonnenten gefunden." });
      return;
    }

    const productsHtml = normalizedProducts.map(product => `
      <div style="margin-bottom: 40px; padding-bottom: 30px; border-bottom: 1px solid #eeeeee;">
        ${product.image ? `
          <div style="margin-bottom: 18px; text-align: center;">
            <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" style="width: 100%; max-width: 520px; max-height: 320px; object-fit: cover; border-radius: 10px; display: block; margin: 0 auto;" />
          </div>
        ` : ""}
        <h3 style="font-family: Arial, sans-serif; font-size: 20px; color: #111111; margin: 0 0 12px 0;">${escapeHtml(product.title)}</h3>
        <p style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.7; color: #555555; margin: 0;">${escapeHtml(product.description)}</p>
      </div>
    `).join("");

    const content = `
      <p style="margin-top: 0; margin-bottom: 30px;">Entdecke unsere aktuellen Produkte und Neuheiten.</p>
      ${productsHtml}
      <p style="font-size: 12px; color: #777777; margin-top: 25px;">Sie erhalten diese E-Mail, weil Sie unseren Newsletter abonniert haben.</p>
    `;

    const html = getBaseTemplate(subject.trim(), content);

    // Kampagne als Entwurf speichern
    const campaign = await NewsletterCampaign.create({
      subject: subject.trim(),
      products: normalizedProducts,
      html,
      status: "draft"
    });

    // E-Mails versenden
    await Promise.all(
      subscribers.map(sub => sendEmail({
        to: sub.email,
        subject: subject.trim(),
        text: `Newsletter: ${subject.trim()}`,
        html,
      }))
    );

    // Kampagne abschließen
    campaign.status = "sent";
    campaign.sentAt = new Date();
    await campaign.save();

    res.status(200).json({ message: "Newsletter erfolgreich gesendet.", campaignId: campaign._id });
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Versand", error });
  }
};