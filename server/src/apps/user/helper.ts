import jwt from "jsonwebtoken";
import { IUser } from './models/User';

const generateAccessToken = (user: IUser) => {
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
    expiresIn: "1h",
  });
};

const generateRefreshToken = (user: IUser) => {
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
    expiresIn: "15d",
  });
};

export {
    generateAccessToken,
    generateRefreshToken,
}
