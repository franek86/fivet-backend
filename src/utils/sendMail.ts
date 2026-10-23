import ejs from "ejs";
import path from "path";

//Render EJS email templete
const renderEmailTemplate = async (templateName: string, data: Record<string, any>): Promise<string> => {
  const templatePath = path.join(process.cwd(), "src", "utils", "email-templates", `${templateName}.ejs`);
  return ejs.renderFile(templatePath, data);
};

export const sendEmail = async (to: string, subject: string, templateName: string, data: Record<string, any>) => {
  const html = await renderEmailTemplate(templateName, data);

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Fivet", email: process.env.EMAIL_FROM! }, // your verified sender
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Email failed: ${res.status} ${body}`);
  }
};
