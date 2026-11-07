import z from "zod";

export const SignInSchema = z.object({
  email: z.email('Please enter a valid work or personal email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export const RegisterSchema = z.object({
  name: z.string().min(1, 'Please enter your full name.'),
  email: z.email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export const ForgotPasswordSchema = z.object({
  email: z.email('Please enter a valid email address.'),
});

export type SignInValues = z.infer<typeof SignInSchema>;
export type RegisterValues = z.infer<typeof RegisterSchema>;
export type ForgotPasswordValues = z.infer<typeof ForgotPasswordSchema>;
