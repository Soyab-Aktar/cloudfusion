import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().min(1).default("5000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  BETTER_AUTH_URL: z.string().min(1, "BETTER_AUTH_URL is required"),
  ACCESS_TOKEN_SECRET: z.string().min(1, "ACCESS_TOKEN_SECRET is required"),
  REFRESH_TOKEN_SECRET: z.string().min(1, "REFRESH_TOKEN_SECRET is required"),
  ACCESS_TOKEN_EXPIRES_IN: z.string().min(1, "ACCESS_TOKEN_EXPIRES_IN is required"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().min(1, "REFRESH_TOKEN_EXPIRES_IN is required"),
  BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN: z
    .string()
    .min(1, "BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN is required"),
  BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE: z
    .string()
    .min(1, "BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE is required"),
  EMAIL_SENDER_SMTP_USER: z.string().min(1, "EMAIL_SENDER_SMTP_USER is required"),
  EMAIL_SENDER_SMTP_PASSWORD: z.string().min(1, "EMAIL_SENDER_SMTP_PASSWORD is required"),
  EMAIL_SENDER_SMTP_HOST: z.string().min(1, "EMAIL_SENDER_SMTP_HOST is required"),
  EMAIL_SENDER_SMTP_PORT: z.string().min(1, "EMAIL_SENDER_SMTP_PORT is required"),
  EMAIL_SENDER_SMTP_FROM: z.string().min(1, "EMAIL_SENDER_SMTP_FROM is required"),
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  GOOGLE_AUTH_CALLBACK_URL: z.string().min(1, "GOOGLE_AUTH_CALLBACK_URL is required"),
  GOOGLE_ACCOUNT_CALLBACK_URL: z.string().min(1, "GOOGLE_ACCOUNT_CALLBACK_URL is required"),
  FRONTEND_URL: z.string().min(1, "FRONTEND_URL is required"),
  ENCRYPTION_SECRET: z
    .string()
    .min(32, "ENCRYPTION_SECRET must be at least 32 characters long"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid or missing environment variables:");
  parsed.error.issues.forEach((issue) => {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  });
  process.exit(1);
}

const data = parsed.data;

export const envVars = {
  NODE_ENV: data.NODE_ENV,
  PORT: data.PORT,
  DATABASE_URL: data.DATABASE_URL,
  BETTER_AUTH_SECRET: data.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: data.BETTER_AUTH_URL,
  ACCESS_TOKEN_SECRET: data.ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET: data.REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN: data.ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN: data.REFRESH_TOKEN_EXPIRES_IN,
  BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN: data.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN,
  BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE: data.BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE,
  EMAIL_SENDER: {
    SMTP_USER: data.EMAIL_SENDER_SMTP_USER,
    SMTP_PASSWORD: data.EMAIL_SENDER_SMTP_PASSWORD,
    SMTP_HOST: data.EMAIL_SENDER_SMTP_HOST,
    SMTP_PORT: data.EMAIL_SENDER_SMTP_PORT,
    SMTP_FROM: data.EMAIL_SENDER_SMTP_FROM,
  },
  GOOGLE_CLIENT_ID: data.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: data.GOOGLE_CLIENT_SECRET,
  GOOGLE_AUTH_CALLBACK_URL: data.GOOGLE_AUTH_CALLBACK_URL,
  GOOGLE_ACCOUNT_CALLBACK_URL: data.GOOGLE_ACCOUNT_CALLBACK_URL,
  FRONTEND_URL: data.FRONTEND_URL,
  ENCRYPTION_SECRET: data.ENCRYPTION_SECRET,
};