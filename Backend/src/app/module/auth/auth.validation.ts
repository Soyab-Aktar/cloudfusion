import { z } from "zod";

const registerZodSchema = z.object({
  name: z.string("Name is required"),
  email: z.email("Invalid email format"),
  password: z.string("Password is required").min(6, "Password must be at least 6 characters"),
});
const loginZodSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string("Password is required").min(6, "Password must be at least 6 characters"),
});
const verifyEmailZodSchema = z.object({
  email: z.string("Email is required").email("Invalid email format"),
  otp: z.string("OTP is required"),
});
const changePasswordZodSchema = z.object({
  currentPassword: z.string("Current password is required"),
  newPassword: z.string("New password is required").min(6, "New password must be at least 6 characters"),
});
const forgotPasswordZodSchema = z.object({
  email: z.string("Email is required").email("Invalid email format"),
});

const resetPasswordZodSchema = z.object({
  email: z.string("Email is required").email("Invalid email format"),
  otp: z.string("OTP is required"),
  newPassword: z.string("New password is required").min(6, "New password must be at least 6 characters"),
});

export const authValidation = {
  registerZodSchema,
  loginZodSchema,
  verifyEmailZodSchema,
  changePasswordZodSchema,
  forgotPasswordZodSchema,
  resetPasswordZodSchema,
}