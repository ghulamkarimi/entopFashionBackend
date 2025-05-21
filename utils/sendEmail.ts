import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  text: string; 
  html?: string; // Optional HTML content
}

export const sendEmail = async ({ to, subject, text }: EmailOptions) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", // z. B. Gmail
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL,     // z. B. deine Gmail-Adresse
        pass: process.env.EMAIL_PASSWORD,     // App-spezifisches Passwort
      },
    });

    await transporter.sendMail({
      from: `"Entop Shop" <${process.env.EMAIL}>`,
      to,
      subject,
      text,
    });

    console.log("✅ E-Mail erfolgreich gesendet an", to);
  } catch (error) {
    console.error("❌ Fehler beim Senden der E-Mail:", error);
  }
};
