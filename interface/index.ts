import { GenderType } from "../gender";

export interface IUser {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    isGuest: boolean;
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
  description: string;
  image: string;
  gender: GenderType;
}
