import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendForgotPasswordEmail = async (email: string, otp: string) => {
  try {
    await resend.emails.send({
      from: 'Expense Tracker <onboarding@resend.dev>',
      to: email,
      subject: 'Your OTP for Password Reset',
      html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`
    });
  } catch (error) {
    console.error('Email send failed:', error);
    throw new Error('Failed to send OTP email');
  }
};
