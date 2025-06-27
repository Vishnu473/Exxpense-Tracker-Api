import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { PasswordResetModel } from '../models/passwordResetModel';
import { generateOTP } from '../utils/generateOtp';
import { sendForgotPasswordEmail } from '../utils/sendEmail';
import bcrypt from 'bcrypt';

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email || typeof email !== 'string') {
            res.status(400).json({ message: 'Invalid email' });
            return;
        }

        const user = await UserModel.findOne({ email });

        if (user) {
            const otp = generateOTP();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

            // Optional: Invalidate previous OTPs
            await PasswordResetModel.updateMany({ email }, { used: true });

            await PasswordResetModel.create({ email, otp, expiresAt });

            await sendForgotPasswordEmail(email, otp);
        }

        res.status(200).json({
            message: 'If this email is registered, an OTP has been sent.',
        });
        return;
    } catch (error) {
        console.error('Error sending otp ', error);
        res.status(500).json({ message: 'Failed to send a otp' });
        return;
    }
};

export const verifyOTP = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            res.status(400).json({ message: 'Email and otp are required' });
            return;
        }
        const passowordRecord = await PasswordResetModel.findOne({ email, otp, used: false });

        if (!passowordRecord) {
            res.status(400).json({ message: 'Invalid or used otp' });
            return;
        }

        if (passowordRecord.expiresAt < new Date()) {
            res.status(400).json('Otp expired');
            return;
        }

        passowordRecord.used = true;
        await passowordRecord.save();

        res.status(200).json({ message: 'OTP verified successfully' });
    } catch (error) {
        console.error('Error verifying otp ', error);
        res.status(500).json({ message: 'Failed to verify a otp' });
        return;
    }
}

export const resendOTP = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email || typeof email !== 'string') {
            res.status(400).json({ message: 'Invalid email' });
            return;
        }

        const user = await UserModel.findOne({ email });

        if (user) {
            const otp = generateOTP();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

            // Optional: Invalidate previous OTPs
            await PasswordResetModel.updateMany({ email }, { used: true });

            await PasswordResetModel.create({ email, otp, expiresAt });

            await sendForgotPasswordEmail(email, otp);
        }

        res.status(200).json({
            message: 'If this email is registered, an OTP has been re-sent.',
        });
        return;
    } catch (error) {
        console.error('Error re-sending OTP ', error);
        res.status(500).json({ message: 'Failed to re-send a OTP' });
        return;
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            res.status(400).json({ message: 'Email and new password required' });
            return;
        }
        const user = await UserModel.findOne({ email });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
        return;
    } catch (error) {
        console.error('Error resetting password ', error);
        res.status(500).json({ message: 'Failed to reset password' });
        return;
    }
};