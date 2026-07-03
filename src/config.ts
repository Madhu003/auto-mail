import nodemailer, { Transporter } from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Email configuration from environment variables
export const transporter: Transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Default delay between emails (in milliseconds)
export const DEFAULT_EMAIL_DELAY = 5000;

// Get email delay from environment or use default
export const getEmailDelay = (): number => {
  return parseInt(process.env.EMAIL_DELAY || String(DEFAULT_EMAIL_DELAY), 10);
};

