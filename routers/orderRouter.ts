import express from "express";
import { createOrder, getMyOrders, getGuestOrder } from "../controllers/orderController";
import { protect } from "../middleware/protect";
 

const router = express.Router();

// Bestellung erstellen (Gast oder Kunde)
router.post("/create", createOrder);

// Eigene Bestellungen (nur für eingeloggte Kunden)
router.get("/my-orders", protect, getMyOrders);

// Gastbestellung anzeigen
router.post("/guest-order", getGuestOrder);

export default router;
