import mongoose, { Document } from "mongoose";
import { GenderType } from "../gender";

export interface IUser {
  _id?: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  isGuest: boolean;
  defaultAddress?: {
    fullName: string;
    street: string;
    houseNumber: string;
    city: string;
    zip: string;
    country: string;
    phone: string;
  };
  isVerified: boolean;
  customerNumber: string;
  isAdmin: boolean;
  owner: boolean;
  accessToken?: string;
  refreshToken?: string;
}

export interface IUserRegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

export interface ICategory extends Document {
  name: string;
  gender: GenderType;
}

export interface IColorOption {
  colorId: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  image: string[];
  category: string | mongoose.Types.ObjectId;
  stock: number;
  colors: IColorOption[];
  sizes?: string[];
  brand?: string;
  sku?: string;
  newPrice?: number;
  isFeatured?: boolean;
  discount?: number;
  deliveryTime?: string;
  tags?: string[];
  material?: string;
  gender: GenderType;
  originCountry?: string;
  weight: number;
  createdAt: Date;
}

export interface INewsletter extends Document {
  email: string;
  subscribed: boolean;
  timeStamp: Date;
}

export type SafeUser = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  address?: any;
  defaultAddress?: IUser["defaultAddress"];
  isAdmin: boolean;
  customerNumber?: string;
  owner?: boolean;
  isAccountVerified?: boolean;
};

export type SafeUserBasic = Pick<
  IUser,
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "defaultAddress"
  | "isAdmin"
  | "customerNumber"
  | "owner"
> & { _id: string };

export type AuthUser = {
  _id?: unknown;
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  isAdmin?: boolean;
  customerNumber?: string;
  owner?: boolean;
  exp?:number;
  defaultAddress?: IUser["defaultAddress"];
};



export interface ICoupon extends Document {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  expiryDate: Date;
  isActive: boolean;
  usageLimit: number | null;
  usedCount: number;
}

