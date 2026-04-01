import { User } from "../models/userSchema";
import asynchandler from "express-async-handler";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail";
import { 
  addressChangedTemplate, 
  welcomeEmailTemplate 
} from "../utils/emailTemplates";
import type {
  IUser,
  IUserRegisterRequest,
  SafeUser,
  AuthUser,
  SafeUserBasic,
} from "../interface";

// Augment Express Request (damit TS req.user kennt)
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Helper: robustes _id -> string
const toIdString = (id: unknown): string => {
  if (!id) return "";
  if (typeof id === "string") return id;
  // mongoose ObjectId hat meist toString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyId = id as any;
  if (typeof anyId?.toString === "function") return anyId.toString();
  return String(id);
};

export const generateCustomerNumber = async (
  firstName: string,
  lastName: string,
) => {
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

export const userRegister = asynchandler(
  async (req: Request<{}, {}, IUserRegisterRequest>, res: Response) => {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    try {
      const userExist = await User.findOne({ email });
      if (userExist) {
        res
          .status(400)
          .json({ message: "Ein Konto mit dieser E-Mail existiert" });
        return;
      }

      if (password !== confirmPassword) {
        res.status(400).json({ message: "Passwörter stimmen nicht überein." });
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
        owner: false,
        isAdmin: false,
        isVerified: false,
      });

      await user.save();
      try {
        await sendEmail({
          to: user.email,
          subject: "Willkommen bei ENTOP SHOP",
          text: `Hallo ${user.firstName}, willkommen bei ENTOP!`,
          html: welcomeEmailTemplate(user.firstName),
        });
      } catch (mailError) {
        console.error(
          "Willkommens-E-Mail konnte nicht gesendet werden:",
          mailError,
        );
        // Wir werfen hier keinen Fehler, damit der User trotzdem registriert bleibt
      }
      res.status(201).json({
        message: "Benutzer wurde erfolgreich erstellt.",
        user: {
          id: toIdString(user._id),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          owner: user.owner,
          isAdmin: user.isAdmin,
          phone: user.phone,
          defaultAddress: user.defaultAddress,
          customerNumber: user.customerNumber,
          isVerified: user.isVerified,
          isGuest: user.isGuest,
        },
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error("Fehler bei der Registrierung:", error);
      res.status(500).json({
        message: "Interner Serverfehler",
        error: err?.message ?? "Unknown error",
      });
    }
  },
);

export const loginUser = asynchandler(async (req: Request, res: Response) => {
  const { email: userEmail, password } = req.body as {
    email: string;
    password: string;
  };

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

  const userId = toIdString(userFound._id);

  const {
    email,
    isAdmin,
    firstName,
    lastName,
    customerNumber,
    owner,
    defaultAddress,
  } = userFound;

  /**
   * WICHTIG: Bitte ENV-Namen konsistent machen.
   * Empfehlung: ACCESS_TOKEN und REFRESH_TOKEN in .env nutzen.
   */
  const accessSecret = process.env.ACCESS_TOKEN;
  const refreshSecret = process.env.REFRESH_TOKEN;

  if (!accessSecret || !refreshSecret) {
    res.status(500).json({
      message: "Token-Secret fehlt in ENV (ACCESS_TOKEN/REFRESH_TOKEN).",
    });
    return;
  }

  const accessToken = jwt.sign(
    {
      userId,
      firstName,
      lastName,
      email,
      isAdmin,
      customerNumber,
      owner,
      defaultAddress,
    },
    accessSecret,
    { expiresIn: "15m" },
  );

  const refreshToken = jwt.sign(
    { userId, firstName, lastName, email, isAdmin },
    refreshSecret,
    { expiresIn: "1d" },
  );

  await User.findByIdAndUpdate(userId, { refreshToken });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 15 * 60 * 1000,
    sameSite: "lax",
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: "lax",
  });

  const decodedAccessToken = jwt.decode(accessToken) as { exp?: number } | null;

  let expDate: string | undefined;
  if (decodedAccessToken?.exp) {
    expDate = new Date(decodedAccessToken.exp * 1000).toLocaleString("de-DE", {
      timeZone: "Europe/Berlin",
    });
  }

  const safeUser: SafeUserBasic = {
    _id: userId,
    firstName,
    lastName,
    email,
    phone: userFound.phone,
    defaultAddress: userFound.defaultAddress,
    isAdmin,
    customerNumber: userFound.customerNumber,
    owner: userFound.owner,
  };

  res.status(200).json({
    message: "User logged in successfully",
    userInfo: decodedAccessToken,
    user: safeUser,
    tokenInfo: {
      exp: decodedAccessToken?.exp,
      expReadable: expDate,
    },
  });
});

export const userLogout = asynchandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    res.status(400).json({ message: "No refresh token provided" });
    return;
  }

  const user = await User.findOne({ refreshToken });
 if (!user) {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  res.status(200).json({ message: "Already logged out" });
  return;
}

  user.refreshToken = undefined;
  await user.save();

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

export const refreshAccessToken = asynchandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401).json({ message: "Nicht authentifiziert" });
      return;
    }

    const userId = req.user.userId ?? toIdString(req.user._id);
    const email = req.user.email;
    const firstName = req.user.firstName;
    const lastName = req.user.lastName;
    const isAdmin = req.user.isAdmin;

    if (
      !userId ||
      !email ||
      !firstName ||
      !lastName ||
      typeof isAdmin === "undefined"
    ) {
      res.status(401).json({ message: "Ungültiger Auth-Kontext" });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(403).json({ message: "Benutzer nicht gefunden" });
      return;
    }

    const accessSecret = process.env.ACCESS_TOKEN ?? process.env.ACCESSTOKEN;
    if (!accessSecret) {
      res.status(500).json({ message: "ACCESS_TOKEN fehlt in ENV." });
      return;
    }

    const newAccessToken = jwt.sign(
      { userId, email, firstName, lastName, isAdmin },
      accessSecret,
      { expiresIn: "15m" },
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000,
      sameSite: "lax",
    });

    res.status(200).json({ message: "AccessToken erneuert" });
  },
);

export const checkAccessToken = asynchandler(
  async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "Kein Access Token vorhanden" });
      return;
    }

    try {
      const accessSecret = process.env.ACCESS_TOKEN ?? process.env.ACCESSTOKEN;
      if (!accessSecret) {
        res.status(500).json({ message: "ACCESS_TOKEN fehlt in ENV." });
        return;
      }

      const decoded = jwt.verify(token, accessSecret);
      res.status(200).json({ message: "Token gültig", user: decoded });
    } catch {
      res.status(401).json({ message: "Token ungültig oder abgelaufen" });
    }
  },
);

export const editUser = asynchandler(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: "Nicht authentifiziert" });
    return;
  }

  const idFromParams = req.params.id;
  const idFromToken = req.user.userId ?? toIdString(req.user._id);
  const targetUserId = idFromParams || idFromToken;

  const isAdmin = req.user.isAdmin;
  const isSelf = idFromToken === targetUserId;

  if (!isAdmin && !isSelf) {
    res.status(403).json({ message: "Keine Berechtigung für dieses Profil" });
    return;
  }

  const { firstName, lastName, email, defaultAddress } =
    req.body as Partial<IUser>;

  const user = await User.findById(targetUserId);
  if (!user) {
    res.status(404).json({ message: "Benutzer nicht gefunden" });
    return;
  }

  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;

  if (email && email !== user.email) {
    const emailExists = await User.findOne({
      email,
      _id: { $ne: user._id },
    });

    if (emailExists) {
      res.status(400).json({ message: "E-Mail wird bereits verwendet" });
      return;
    }

    user.email = email;
  }

  let adresseChanged = false;

  if (defaultAddress) {
    const hasAnyAddressField =
      !!defaultAddress.fullName?.trim() ||
      !!defaultAddress.street?.trim() ||
      !!defaultAddress.houseNumber?.trim() ||
      !!defaultAddress.city?.trim() ||
      !!defaultAddress.zip?.trim() ||
      !!defaultAddress.country?.trim() ||
      !!defaultAddress.phone?.trim();

    if (hasAnyAddressField) {
      const { street, houseNumber, city, zip, country } = defaultAddress;

      if (!street || !houseNumber || !city || !zip || !country) {
        res.status(400).json({ message: "Unvollständige Adressdaten" });
        return;
      }

      const alteAdresse = JSON.stringify(user.defaultAddress || {});
      const neueAdresse = JSON.stringify(defaultAddress);

      adresseChanged = alteAdresse !== neueAdresse;

      user.defaultAddress = {
        fullName: defaultAddress.fullName || "",
        street: defaultAddress.street || "",
        houseNumber: defaultAddress.houseNumber || "",
        city: defaultAddress.city || "",
        zip: defaultAddress.zip || "",
        country: defaultAddress.country || "",
        phone: defaultAddress.phone || "",
      };
    }
  }

  const updatedUser = await user.save();

  if (adresseChanged) {
    try {
      await sendEmail({
        to: updatedUser.email,
        subject: "Ihre Adresse wurde geändert",
        text: `Hallo ${updatedUser.firstName}, Ihre Adresse wurde geändert.`,
        html: addressChangedTemplate(updatedUser.firstName),
      });
    } catch (mailError) {
      console.error("Fehler beim Senden der Änderungs-E-Mail:", mailError);
    }
  }

  res.status(200).json({
    message: "Benutzerdaten erfolgreich aktualisiert",
    user: {
      id: toIdString(updatedUser._id),
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      defaultAddress: updatedUser.defaultAddress,
    },
  });
});

export const getUsers = asynchandler(async (_req: Request, res: Response) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch {
    res.status(500).json({ message: "Internal server error" });
  }
});

export const getCurrentUser = asynchandler(
  async (req: Request, res: Response) => {
    if (!req.user?.userId) {
      res.status(401).json({ message: "Nicht eingeloggt" });
      return;
    }

    const user = await User.findById(req.user.userId).select(
      "firstName lastName email isAdmin defaultAddress"
    ).lean();

    if (!user) {
      res.status(404).json({ message: "Benutzer nicht gefunden" });
      return;
    }

    res.status(200).json({
      user: {
        userId: toIdString(user._id),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isAdmin: user.isAdmin,
        defaultAddress: user.defaultAddress,
        exp: req.user.exp ?? null,
      },
    });
  }
);

export const updateMyAdminProfile = asynchandler(async (req, res) => {
  if (!req.user?.userId) {
    res.status(401);
    throw new Error("Nicht autorisiert");
  }

  const user = await User.findById(req.user.userId).select(
    "firstName lastName email phone isAdmin defaultAddress",
  );

  if (!user) {
    res.status(404);
    throw new Error("Admin nicht gefunden");
  }

  // (eigentlich reicht isAdmin-Middleware; optional als Extra-Schutz)
  if (!user.isAdmin) {
    res.status(403);
    throw new Error("Nur Admins erlaubt");
  }

  const { email, phone, address } = req.body as Partial<{
    email: string;
    phone: string;
    address: any;
  }>;

  if (email && email !== user.email) {
    const exists = await User.findOne({ email }).select("_id");
    if (exists && !exists._id.equals(user._id)) {
      res.status(400);
      throw new Error("Diese E-Mail ist bereits vergeben");
    }
    user.email = email;
  }

  if (typeof phone !== "undefined") user.phone = phone;

  if (address && typeof address === "object") {
    user.defaultAddress = {
      ...(user.defaultAddress ?? {}),
      ...address,
    };
  }

  const saved = await user.save();
  const obj = saved.toObject() as any;
  delete obj.password;
  delete obj.refreshToken;

  res.json({
    message: "Profil aktualisiert",
    user: {
      _id: toIdString(saved._id),
      firstName: obj.firstName,
      lastName: obj.lastName,
      email: obj.email,
      phone: obj.phone,
      defaultAddress: obj.defaultAddress,
      isAdmin: obj.isAdmin,
    },
  });
});

export const getOwner = asynchandler(async (_req: Request, res: Response) => {
  const owner = await User.findOne({ owner: true })
    .select("firstName lastName email phone defaultAddress")
    .lean();

  if (!owner) {
    res.status(404).json({ message: "Owner not found" });
    return;
  }

  // defaultAddress kann optional sein -> safe access
  const a = (owner as any).defaultAddress as
    | IUser["defaultAddress"]
    | undefined;

  res.status(200).json({
    shop: "ENTOP HOME",
    inhaber: `${(owner as any).firstName} ${(owner as any).lastName}`,
    email: (owner as any).email,
    phone: (owner as any).phone,
    address: {
      street: a?.street ?? "",
      houseNumber: a?.houseNumber ?? "",
      zip: a?.zip ?? "",
      city: a?.city ?? "",
      country: a?.country ?? "",
      phone: a?.phone ?? "",
    },
  });
});
