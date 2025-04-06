import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { sendEmail } from "../../../lib/email"
import jwt from 'jsonwebtoken';
import { generateAccessToken, generateRefreshToken } from "../helper"
import { generateRandomNumber } from "../../../lib/helper"
import ApiError from '../../../utils/ApiError';
import { getNextSequence } from '../../../lib/helpers';


const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { full_name, email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new ApiError('Email already exists', 400);
    }

    const otp = generateRandomNumber(6);
    const otp_expire = new Date(Date.now() + 5 * 60 * 1000);
  
    const user = new User({ full_name, email, password, email_verified_otp: otp, email_verified_otp_expire: otp_expire });
    await user.save();

    // Send verification email
    await sendEmail(
        user.email, 
        'Please verify your email',
        `Your verification code is: ${otp}. This code will expire in 5 minutes.`
    );
    res.status(201).json({ message: 'User created successfully. A One time password email has been sent.' });
  } catch (error) {
    next(error);
  }
};

const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError('Invalid credentials', 400);
    }

    if (!user.email_verified_at) {
      throw new ApiError('Email not verified', 400);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError('Invalid credentials', 400);
      return;
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    const userData = await user.toJSON();
    res.cookie('at_fm_9274', accessToken, { httpOnly: true, secure: process.env.NODE_ENV !== 'development' });
    res.cookie('rt_fm_9247', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV !== 'development' });
    res.status(200).json({ message: 'Login successful', user: userData });
  } catch (error) {
    next(error);
  }
};

const verifyOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { otp, email } = req.body;
    const user = await User.findOne({ email_verified_otp: otp, email, email_verified_otp_expire: { $gt: new Date() } });

    if (!user) {
      throw new ApiError('Invalid otp', 400);
    }

    user.email_verified_at = new Date();
    user.email_verified_otp = undefined;
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie('at_fm_9274', accessToken, { httpOnly: true, secure: process.env.NODE_ENV !== 'development' });
    res.cookie('rt_fm_9247', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV !== 'development' });
    
    const userData = await user.toJSON();
    res.status(200).json({ message: 'Email verified successfully', user: userData });
  } catch (error) {
    next(error)
  }
}

const resendOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({email});
    if (!user) {
      throw new ApiError('Email does not exists', 400);
    }
    if (user.email_verified_at) {
      throw new ApiError('Email already verified', 400);
    }

    // check if the otp generated within 30 seconds.
    if (user.email_verified_otp_expire && user.email_verified_otp_expire > new Date(Date.now() + 30 * 1000)) {
      throw new ApiError('Please wait for 30 seconds before requesting another OTP', 400);
    }

    const otp = generateRandomNumber(6);
    const otp_expire = new Date(Date.now() + 5 * 60 * 1000);
    user.email_verified_otp = otp;
    user.email_verified_otp_expire = otp_expire;
    await user.save();

    // Send verification email
    await sendEmail(
        user.email, 
        'Please verify your email',
        `Your verification code is: ${otp}. This code will expire in 5 minutes.`
    );
    res.status(200).json({ message: 'A One time password email has been sent.' });
  } catch (error) {
    next(error)
  }
}

const refreshAccessToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies.rt_fm_9247;
    if (!refreshToken) {
      res.status(400).json({ message: 'Refresh token not provided' });
      return;
    }

    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET!);
    if (!payload) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    const user = await User.findById((payload as any).userId);
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    const newAccessToken = generateAccessToken(user);
    res.cookie('at_fm_9274', newAccessToken, { httpOnly: true, secure: process.env.NODE_ENV !== 'development' });
    res.status(200).json({ message: 'Access token refreshed', access_token: newAccessToken });
  } catch (error) {
    next(error);
  }
};

const logout = (req: Request, res: Response): void => {
  res.clearCookie('at_fm_9274');
  res.clearCookie("rt_fm_9247");
  res.status(200).json({ message: 'Logged out successfully' });
};

export { signup, login, refreshAccessToken, logout, verifyOTP, resendOTP };
