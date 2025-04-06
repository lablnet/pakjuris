import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';
import { sendEmail } from "../../../lib/email"
import { generateRandomNumber } from "../../../lib/helper"
import ApiError from '../../../utils/ApiError';

const sendResetOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    const user : IUser | null = await User.findOne({ email });

    if (!user) {
      throw new ApiError('Email does not exists', 400);
    }

    const OTP = generateRandomNumber(6);

    // add otp to user with expire to 5 min.
    user.reset_password_otp = OTP;
    user.reset_password_otp_expire = new Date(Date.now() + 5 * 60 * 1000);
    user.save();

    // Send verification email
    await sendEmail(user.email, 'Your password reset OTP', `Your OTP for password reset is: ${OTP}. This OTP will expire in 5 minutes.`);

    res.status(201).json({ message: 'OTP sent successfully' });
  } catch (error) {
    next(error);
  }
};

const validateOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, otp } = req.body;
        const user : IUser | null = await User.findOne({ email, reset_password_otp: otp, reset_password_otp_expire: { $gt: new Date() } });
        if (!user) {
            throw new ApiError('Invalid OTP', 400);
        }
        res.status(200).json({ message: 'OTP is valid' });
    } catch (error) {
        next(error);
    }
}

const updatePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, otp, password } = req.body;
        const user : IUser | null = await User.findOne({ email, reset_password_otp: otp, reset_password_otp_expire: { $gt: new Date() } });
        if (!user) {
          throw new ApiError('Invalid OTP', 400);
        }
        user.password = password;
        user.reset_password_otp = undefined;
        user.reset_password_otp_expire = undefined;
        user.save();
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        next(error);
    }
}

export { sendResetOTP, validateOTP, updatePassword };
