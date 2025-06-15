import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required" }),
  
  email: z
    .string()
    .email({ message: "Please enter a valid email address" }),

  phone: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits" })
    .max(15, { message: "Phone number must not exceed 15 digits" }),

  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});


export const loginSchema = z.object({
  email: z
    .string()
    .email({ message: "Please enter a valid email address" }),

  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});

export const accountNameSchema = z.object({
  name: z
    .string({
      required_error: 'Name is required',
      invalid_type_error: 'Name must be a string',
    })
    .min(1, 'Name must not be empty')
    .max(50, 'Name must be less than 50 characters'),
});