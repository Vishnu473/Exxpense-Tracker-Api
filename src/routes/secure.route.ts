import { forgotPassword, resendOTP, resetPassword, verifyOTP } from "../controllers/secure.controller";
import { validate } from "../middleware/requestValidate";
import { PasswordSchema, verifyOTPSchema } from "../zod/secure.schema";
import express from 'express';

const router = express.Router();

router.post("/forgot-password", validate(PasswordSchema), forgotPassword);
router.post("/verify-otp", validate(verifyOTPSchema), verifyOTP);
router.post("/resend-otp", validate(PasswordSchema), resendOTP);
router.post("/reset-password",validate(PasswordSchema),resetPassword);

export default router;