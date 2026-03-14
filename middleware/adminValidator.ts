// validators/adminValidators.ts

import { Request, Response, NextFunction } from "express";
import { body } from "express-validator/lib/middlewares/validation-chain-builders";

import { validationResult } from "express-validator/lib/validation-result";
export const validateAdminSelfUpdate = [
  body("email").optional().isEmail().withMessage("E-Mail ist ungültig").normalizeEmail(),
  body("phone").optional().isString().isLength({ min: 5, max: 30 }).withMessage("Telefon ist ungültig"),
  body("address").optional().isObject().withMessage("Adresse muss ein Objekt sein"),
  body("address.fullName").optional().isString().isLength({ max: 120 }),
  body("address.street").optional().isString().isLength({ max: 120 }),
  body("address.city").optional().isString().isLength({ max: 80 }),
  body("address.zip").optional().isString().isLength({ max: 20 }),
  body("address.country").optional().isString().isLength({ max: 56 }),
  body("address.phone").optional().isString().isLength({ max: 30 }),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422);
      throw new Error(errors.array().map(e => e.msg).join(", "));
    }
    next();
  },
];
