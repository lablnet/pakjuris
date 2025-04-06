import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../apps/user/models/User';

// Extend the Express Request interface to include `user`
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

/**
 * Authentication middleware to verify JWT and attach user to the request object.
 * @param req - Express Request object.
 * @param res - Express Response object.
 * @param next - Express NextFunction.
 * 
 * @since v1.0.0
 */
const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies.at_fm_9274;

  if (!token) {
    res.status(401).json({ message: 'Access token missing' });
    return; // Explicitly return to ensure `void` is returned
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    // Fetch the user from the database
    const user = await User.findById(decoded.userId);

    if (!user) {
      // remove cookies.
      res.clearCookie('at_fm_9274');
      res.clearCookie("rt_fm_9247");
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // Attach the user to the request object
    req.user = user;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
    return;
  }
};

export default authMiddleware;
