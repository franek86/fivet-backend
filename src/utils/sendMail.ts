import { Resend } from "resend";
import ejs from "ejs";
import path from "path";

const resend = new Resend(process.env.RESEND_API_KEY);

//Render EJS email templete
const renderEmailTemplate = async (templateName: string, data: Record<string, any>): Promise<string> => {
  const templatePath = path.join(process.cwd(), "src", "utils", "email-templates", `${templateName}.ejs`);
  return ejs.renderFile(templatePath, data);
};

export const sendEmail = async (to: string, subject: string, templateName: string, data: Record<string, any>) => {
  const html = await renderEmailTemplate(templateName, data);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!, // e.g. "Fivet <noreply@yourdomain.com>"
    to,
    subject,
    html,
  });
  if (error) throw new Error(`Email failed: ${error.message}`);
};
