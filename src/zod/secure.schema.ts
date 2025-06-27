import { z } from "zod";

export const PasswordSchema = z.object({
    email: z.string().email("Invalid email format"),
});

export const verifyOTPSchema = z.object({
    email: z.string().email(),
    otp: z.string().length(6, "OTP must be 6 digits"),
});
