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

export const authValidation = {
  registerZodSchema,
  loginZodSchema,
}