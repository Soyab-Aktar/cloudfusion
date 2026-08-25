import nodemailer from 'nodemailer';
import { envVars } from '../config/env';
import AppError from '../errorHelpers/AppError';
import status from 'http-status';
import path from 'path';
import ejs from 'ejs';

interface ISendEmailOptions {
  to: string;
  subject: string;
  templateName: string;
  templateData: Record<string, any>;
  attachments?: {
    fileName: string;
    content: Buffer | string;
    contentType: string;
  }[];

}

const transporter = nodemailer.createTransport({
  host: envVars.EMAIL_SENDER.SMTP_HOST,
  secure: Number(envVars.EMAIL_SENDER.SMTP_PORT) === 465,
  auth: {
    user: envVars.EMAIL_SENDER.SMTP_USER,
    pass: envVars.EMAIL_SENDER.SMTP_PASSWORD
  },
  port: Number(envVars.EMAIL_SENDER.SMTP_PORT),
})

export const sendEmail = async ({ subject, templateData, templateName, to, attachments }: ISendEmailOptions) => {
  try {
    const templatePath = path.resolve(process.cwd(), `src/app/template/${templateName.toLowerCase()}.ejs`);
    const html = await ejs.renderFile(templatePath, templateData);
    const info = await transporter.sendMail({
      from: envVars.EMAIL_SENDER.SMTP_FROM,
      to: to,
      subject: subject,
      html: html,
      attachments: attachments?.map((att) => ({
        filename: att.fileName,
        content: att.content,
        contentType: att.contentType
      }))
    })
    console.log(`Email sent to ${to} : ${info.messageId}`);
  } catch (error: any) {
    console.error("Email Sending Error:", error.message);
    throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to send email");
  }

}