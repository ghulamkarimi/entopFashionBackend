import { GenderType } from "../gender";

export interface IUser {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    isGuest: boolean;
    defaultAddress?: {
      fullName: string;
      street: string;
      city: string;
      zip: string;
      country: string;
      phone: string;
    };
    isVerified: boolean;
    customerNumber: string;
    isAdmin: boolean;
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
  description: string;
  image: string;
}

 