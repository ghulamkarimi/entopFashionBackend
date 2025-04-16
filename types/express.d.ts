import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        firstName: string;
        lastName: string;
        isAdmin: boolean;
        _id?: string;
      };
    }
  }
}
