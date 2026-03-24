import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: EmailOptions) => {
  const email = process.env.EMAIL;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!email || !emailPassword) {
    throw new Error("EMAIL oder EMAIL_PASSWORD fehlt in den Umgebungsvariablen");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: email,
      pass: emailPassword,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Entop Shop" <${email}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("✅ E-Mail erfolgreich gesendet an", to);
  } catch (error) {
    console.error("❌ Fehler beim Senden der E-Mail:", error);
    throw error;
  }
};