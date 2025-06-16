import { Request, Response } from "express";
import Newsletter from "../models/newsletterSchema";
import { sendEmail } from "../utils/sendEmail";

// POST /api/newsletter/subscribe
export const subscribe = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  try {
    const existing = await Newsletter.findOne({ email });

    if (existing) {
      if (existing.subscribed) {
        res.status(400).json({ message: "Diese E-Mail ist bereits abonniert." });
        return;
      } else {
        existing.subscribed = true;
        await existing.save();
        res.status(200).json({ message: "Abo wurde wieder aktiviert." });
        return;
      }
    }

    const newSubscriber = new Newsletter({ email });
    await newSubscriber.save();
    res.status(201).json({ message: "Erfolgreich abonniert." });
  } catch (error) {
    res.status(500).json({ message: "Ein Fehler ist aufgetreten.", error });
  }
};

// POST /api/newsletter/unsubscribe
export const unsubscribe = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  try {
    const subscriber = await Newsletter.findOne({ email });

    if (!subscriber || !subscriber.subscribed) {
      res.status(404).json({ message: "E-Mail nicht gefunden oder bereits abgemeldet." });
      return;
    }

    subscriber.subscribed = false;
    await subscriber.save();
    res.status(200).json({ message: "Erfolgreich abgemeldet." });
  } catch (error) {
    res.status(500).json({ message: "Ein Fehler ist aufgetreten.", error });
  }
};

// GET /api/newsletter
export const getAll = async (_req: Request, res: Response): Promise<void> => {
  try {
    const subscribers = await Newsletter.find();
    res.status(200).json(subscribers);
  } catch (error) {
    res.status(500).json({ message: "Ein Fehler ist aufgetreten.", error });
  }
};

// POST /api/newsletter/send
export const sendNewsletter = async (req: Request, res: Response): Promise<void> => {
  const { subject, products } = req.body;

  if (!subject || !products || !Array.isArray(products)) {
    res.status(400).json({ message: "Ungültige Eingabe" });
    return;
  }

  try {
    const subscribers = await Newsletter.find({ subscribed: true });

    if (subscribers.length === 0) {
      res.status(400).json({ message: "Keine Abonnenten gefunden." });
      return;
    }

    const contentHtml = `
      <div style="font-family: Arial, sans-serif;">
        <h2>${subject}</h2>
        ${products
          .map(
            (product) => `
            <div style="margin-bottom: 30px;">
              <h3>${product.title}</h3>
              <img src="${product.image}" alt="${product.title}" style="max-width: 100%; border-radius: 8px;" />
              <p>${product.description}</p>
            </div>
          `
          )
          .join("")}
        <hr />
        <p style="font-size: 12px; color: gray;">
          Sie erhalten diese E-Mail, weil Sie unseren Newsletter abonniert haben.
        </p>
      </div>
    `;

    for (const subscriber of subscribers) {
      await sendEmail({
        to: subscriber.email,
        subject: subject,
        text: `Hallo, hier ist unser Newsletter: ${subject}`,
        html: contentHtml,
      });
    }

    res.status(200).json({ message: "Newsletter erfolgreich gesendet." });
  } catch (error) {
    res.status(500).json({ message: "Fehler beim Versand", error });
  }
};