
import { User } from "../models/userSchema";
import { IUser } from "../interface";
import { IUserRegisterRequest } from "../interface";
import asynchandler from "express-async-handler";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail";
 


export const generateCustomerNumber = async (firstName: string, lastName: string) => {
    let isUnique = false;
    let customerNumber: IUser["customerNumber"] = "";

    const firstInitial = firstName.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();

    while (!isUnique) {
        const randomNum = Math.floor(1000 + Math.random() * 9000).toString();
        customerNumber = `${firstInitial}${lastInitial}${randomNum}`;
        const existUser = await User.findOne({ customerNumber });
        if (!existUser) isUnique = true;
    }

    return customerNumber;
};

export const userRegister = asynchandler(async (req: Request<{}, {}, IUserRegisterRequest>, res: Response) => {
    const { firstName, lastName, email, password, confirmPassword} = req.body;
    try {
        const userExist = await User.findOne({ email });
        if (userExist) {
            res.status(400).json({ message: "Ein Konto mit dieser E-Mail existiert" });
            return;
        }
        if (password !== confirmPassword) {
          res
            .status(400)
            .json({ message: "Passwörter stimmen nicht überein." });
          return;
        }
        const customerNumber = await generateCustomerNumber(firstName, lastName);
        const user = new User({
            firstName,
            lastName,
            email,
            password,
            customerNumber,
            isGuest: false,
            isAdmin: false,
            isVerified: false,
        });
        await user.save();
        res.status(201).json({
            message: "Benutzer wurde erfolgreich erstellt.",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                customerNumber: user.customerNumber,
                isVerified: user.isVerified,
                isGuest: user.isGuest,
            }
        });

    } catch (error: any) {
      console.error("❌ Fehler bei der Registrierung:", error); // <- Konsole zeigt den echten Fehler
      res.status(500).json({
        message: "Interner Serverfehler",
        error: error.message,
      });
    }
    
});

export const loginUser = asynchandler(async (req: Request, res: Response) => {
  const { email: userEmail, password } = req.body;

  const userFound = await User.findOne({ email: userEmail });
  if (!userFound) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const isPasswordCorrect = await userFound.isPasswordMatch(password);
  if (!isPasswordCorrect) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const {
    _id: userId,
    email,
    isAdmin,
    firstName,
    lastName,
  } = userFound;

  const accessToken = jwt.sign(
    { userId, firstName, lastName, email, isAdmin },
    process.env.ACCESSTOKEN,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { userId, firstName, lastName, email, isAdmin },
    process.env.REFRESHTOKEN,
    { expiresIn: "1d" }
  );

  // RefreshToken in der DB speichern
  await User.findByIdAndUpdate(userId, {
    refreshToken
  });

  // Cookies setzen
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 15 * 60 * 1000, // 15 Min
    sameSite: "lax",
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge:  24 * 60 * 60 * 1000, // 1 Tag
    sameSite: "lax",
  });

  const decodedAccessToken = jwt.decode(accessToken);
  let expDate: string | undefined;
  if (typeof decodedAccessToken === 'object' && decodedAccessToken?.exp) {
    expDate = new Date(decodedAccessToken.exp * 1000).toLocaleString("de-DE", {
      timeZone: "Europe/Berlin",
    });
  }
  
  res.status(200).json({
    message: "User logged in successfully",
    userInfo: decodedAccessToken,
    user: {
      id: userId,
      firstName,
      lastName,
      email,
      isAdmin,
      exp: typeof decodedAccessToken === "object" && "exp" in decodedAccessToken
        ? decodedAccessToken.exp
        : undefined,
      expReadable: expDate,
    }
  });
});



export const userLogout = asynchandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    res.status(400).json({ message: "No refresh token provided" });
    return;
  }

  const user = await User.findOne({ refreshToken });
  if (!user) {
    res.status(400).json({ message: "User not found" });
    return;
  }

  user.refreshToken = undefined;
  await user.save();

  // Beide Cookies löschen
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({ message: "Logout erfolgreich" });
});

export const refreshAccessToken = asynchandler(async (req: Request, res: Response) => {
  const { userId, email, firstName, lastName, isAdmin } = req.user;

  const user = await User.findById(userId);
  if (!user) {
    res.status(403).json({ message: "Benutzer nicht gefunden" });
    return;
  }

  const newAccessToken = jwt.sign(
    { userId, email, firstName, lastName, isAdmin },
    process.env.ACCESSTOKEN!,
    { expiresIn: "15m" }
  );

  res.cookie("accessToken", newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 15 * 60 * 1000, // 15 Minuten
    sameSite: "lax",
  });

  res.status(200).json({ message: "AccessToken erneuert" });
});



export const checkAccessToken = asynchandler(async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "Kein Access Token vorhanden" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESSTOKEN as string);
    res.status(200).json({ message: "Token gültig", user: decoded });
  } catch (error) {
    res.status(401).json({ message: "Token ungültig oder abgelaufen" });
  }
});

 

export const editUser = asynchandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: "Nicht authentifiziert" });
    return;
  }

  const { firstName, lastName, email, defaultAddress } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404).json({ message: "Benutzer nicht gefunden" });
    return;
  }

  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;

  if (email && email !== user.email) {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      res.status(400).json({ message: "E-Mail wird bereits verwendet" });
      return;
    }
    user.email = email;
  }

  let adresseGeändert = false;

  if (defaultAddress) {
    const { street,houseNumber, city, zip, country, phone } = defaultAddress;
    if ( !street || !houseNumber|| !city || !zip || !country || !phone) {
      res.status(400).json({ message: "Unvollständige Adressdaten" });
      return;
    }

    const alteAdresse = JSON.stringify(user.defaultAddress || {});
    const neueAdresse = JSON.stringify(defaultAddress);

    if (alteAdresse !== neueAdresse) {
      adresseGeändert = true;
    }

    user.defaultAddress = { ...defaultAddress };
  }

  const updatedUser = await user.save();

  if (adresseGeändert) {
    await sendEmail({
      to: user.email,
      subject: "Ihre Adresse wurde geändert",
      text: `Hallo ${user.firstName},\n\nIhre Standardadresse wurde geändert.\nFalls Sie diese Änderung nicht selbst vorgenommen haben, kontaktieren Sie bitte sofort unser Team.\n\nIhr EntopFashion-Team`,
      html: `
        <h2>Hallo ${user.firstName},</h2>
        <p>Ihre Standardadresse wurde geändert.</p>
        <p>Falls Sie diese Änderung nicht selbst vorgenommen haben, kontaktieren Sie bitte sofort unser Team.</p>
        <br/>
        <strong>Ihr EntopFashion-Team</strong>
      `,
    });
  }

  res.status(200).json({
    message: "Benutzerdaten erfolgreich aktualisiert",
    user: {
      id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      defaultAddress: updatedUser.defaultAddress,
    },
  });
});


export const getUsers = asynchandler(async (req: Request, res: Response) => {
  try {
    const users = await User.find();
    res.json(users); 
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

 
export const getCurrentUser = asynchandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: "Nicht eingeloggt" });
    return;
  }

  const user = await User.findById(req.user._id).select("-password -refreshToken");

  if (!user) {
    res.status(404).json({ message: "Benutzer nicht gefunden" });
    return;
  }

  // Zugriff auf decoded token
  const accessToken = req.cookies.accessToken;
  const decoded = jwt.decode(accessToken) as { exp?: number };

  res.status(200).json({
    user: {
      ...user.toObject(),
      exp: decoded?.exp ?? null,      
      userId: user._id.toString(),    
    }
  });
});









