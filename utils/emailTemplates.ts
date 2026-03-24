export const getBaseTemplate = (title: string, content: string) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin: 0; padding: 0; background-color: #f4f4f4; -webkit-text-size-adjust: 100%;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding: 40px 10px;">
          <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 4px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08);" cellspacing="0" cellpadding="0" border="0">
            
            <tr>
              <td style="background-color: #111111; padding: 40px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-family: 'Helvetica', Arial, sans-serif; font-size: 28px; letter-spacing: 5px; font-weight: 300; text-transform: uppercase;">
                  ENTOP
                </h1>
                <p style="color: #888888; margin: 5px 0 0 0; font-family: Arial, sans-serif; font-size: 10px; letter-spacing: 2px; text-transform: uppercase;">
                  Premium Home & Fashion
                </p>
              </td>
            </tr>

            <tr>
              <td height="1" style="background-color: #e0e0e0;"></td>
            </tr>

            <tr>
              <td style="padding: 50px 40px; background-color: #ffffff;">
                <h2 style="color: #111111; font-family: 'Helvetica', Arial, sans-serif; font-size: 22px; font-weight: 400; margin: 0 0 25px 0; text-align: center;">
                  ${title}
                </h2>
                <div style="color: #555555; font-family: 'Georgia', serif; font-size: 16px; line-height: 1.8; text-align: left; margin-bottom: 30px;">
                  ${content}
                </div>
                
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td align="center" style="padding: 20px 0;">
                      <a href="http://localhost:3000/" target="_blank" style="background-color: #111111; color: #ffffff; padding: 15px 35px; text-decoration: none; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; border-radius: 2px; display: inline-block; letter-spacing: 1px;">
                        ZUM SHOP
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding: 30px 40px; background-color: #fbfbfb; border-top: 1px solid #f0f0f0; text-align: center;">
                <p style="color: #999999; font-family: Arial, sans-serif; font-size: 12px; margin: 0 0 10px 0;">
                  Du erhältst diese E-Mail, weil du ein registrierter Kunde bei ENTOP bist.
                </p>
                <div style="margin-top: 15px;">
                  <span style="color: #111111; font-size: 12px; font-weight: bold;">ENTOP HOME</span>
                  <p style="color: #bbbbbb; font-size: 11px; margin: 5px 0 0 0;">
                    &copy; ${new Date().getFullYear()} Alle Rechte vorbehalten.
                  </p>
                </div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

export const welcomeEmailTemplate = (firstName: string) => {
  const title = "Willkommen bei ENTOP SHOP!";
  const content = `
    Hallo <strong>${firstName}</strong>,<br><br>
    vielen Dank für deine Registrierung! Wir freuen uns sehr, dich als Kunden begrüßen zu dürfen.<br><br>
    Viel Spaß beim Shoppen!
  `;
  return getBaseTemplate(title, content);
};

export const addressChangedTemplate = (firstName: string) => {
  const title = "Adressänderung bestätigt";
  const content = `
    Hallo <strong>${firstName}</strong>,<br><br>
    deine Standardadresse wurde erfolgreich aktualisiert.
  `;
  return getBaseTemplate(title, content);
};