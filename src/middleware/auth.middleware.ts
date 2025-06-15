import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.utils';
import { UserModel } from '../models/user.model';

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;

  if (!token) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  try {
    const decoded = verifyToken(token);
    const user = await UserModel.findById(decoded.userId).select('-password');
    if (!user) {
        res.status(401).json({ message: 'User not found' });
        return;
    }

    req.user = user; // Attach to req object
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
    return;
  }
};
