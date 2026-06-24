import { z } from "zod";

export const emailSchema = z.string().trim().email().max(254).toLowerCase();

export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters.")
  .max(128, "Password must be 128 characters or fewer.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.");

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80, "Name must be 80 characters or fewer."),
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required.").max(128),
});
