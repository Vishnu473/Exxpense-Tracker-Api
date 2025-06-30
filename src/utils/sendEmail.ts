import { Resend } from 'resend';
import nodemailer from 'nodemailer';
const resend = new Resend(process.env.RESEND_API_KEY);

// export const sendForgotPasswordEmail = async (email: string, otp: string) => {
//   try {
//     await resend.emails.send({
//       from: 'Expense Tracker <onboarding@resend.dev>',
//       to: email,
//       subject: 'Your OTP for Password Reset',
//       html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`
//     });
//   } catch (error) {
//     console.error('Email send failed:', error);
//     throw new Error('Failed to send OTP email');
//   }
// };

export const sendForgotPasswordEmail = async (email: string, otp: string) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,        
      pass: process.env.GMAIL_APP_PASSWORD 
    }
  });

  const mailOptions = {
    from: `"ExpenseTracker" <${process.env.GMAIL_USER}>`,
    to:email,
    subject: 'Your OTP Code',
    text: `Your OTP is: ${otp}`,
    html: `<p>Your <strong>OTP</strong> is: <strong>${otp}</strong></p>`
  };

  await transporter.sendMail(mailOptions);
};
