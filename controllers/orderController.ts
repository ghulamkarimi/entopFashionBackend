import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Order from "../models/orderSchema";
 

// 🛒 Bestellung erstellen (Gast oder eingeloggter User)
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { items, shippingAddress, totalAmount, email, name } = req.body;

  // Pflichtfelder prüfen
  if (!items || items.length === 0 || !shippingAddress || !totalAmount) {
    res.status(400).json({ message: "Unvollständige Bestelldaten" });
    return;
  }

  let userId = null;

  if (req.user?._id) {
    // Eingeloggter Benutzer
    userId = req.user._id;
  } else {
    // Gast muss Email angeben
    if (!email) {
      res.status(400).json({ message: "E-Mail-Adresse ist erforderlich für Gastbestellungen" });
      return;
    }
  }

  const order = new Order({
    userId: userId || null,
    email,
    name,
    items,
    shippingAddress,
    totalAmount,
    paymentStatus: "offen", // kann später geändert werden
  });

  const savedOrder = await order.save();

  res.status(201).json({
    message: "Bestellung erfolgreich erstellt",
    orderId: savedOrder._id,
  });
});

//  Eigene Bestellungen für eingeloggte Benutzer
export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: "Nicht autorisiert" });
    return;
  }

  const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// 🔍 Gastbestellung prüfen (z. B. mit E-Mail + Bestell-ID)
export const getGuestOrder = asyncHandler(async (req: Request, res: Response) => {
  const { email, orderId } = req.body;

  if (!email || !orderId) {
    res.status(400).json({ message: "E-Mail und Bestellnummer erforderlich" });
    return;
  }

  const order = await Order.findOne({ _id: orderId, email });

  if (!order) {
    res.status(404).json({ message: "Bestellung nicht gefunden" });
    return;
  }

  res.json(order);
});
