import { Request, Response, NextFunction } from 'express';
import { generateAccessToken, generateRefreshToken, getTokenExpiry, verifyToken } from '../utils/jwt.utils';
import { UserModel } from '../models/user.model';

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.cookies.token;
  const refreshToken = req.cookies.refreshToken;
  
  console.log("accessToken",accessToken);
  console.log("refreshToken",refreshToken);
  
  if (!accessToken) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  try {
    const decoded = verifyToken(accessToken);
    const user = await UserModel.findById(decoded.userId).select('-password');
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError' && refreshToken) {
      try {
        const decodedRefresh = verifyToken(refreshToken);
        const user = await UserModel.findById(decodedRefresh.userId).select('-password');
        if (!user) {
          res.status(401).json({ message: 'User not found' });
          return;
        }

        //Refresh token rotation logic
        const refreshExp = getTokenExpiry(refreshToken);
        // const daysLeft = (refreshExp - Date.now()) / (1000 * 60 * 60 * 24);
        const daysLeft = (refreshExp - Date.now()) / (1000 * 60 * 3);


        // Issue new refresh token if < 7 days left
        if (daysLeft < 7) {
          const newRefreshToken = generateRefreshToken(user?._id.toString());
          res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            sameSite: 'none',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 21 * 24 * 60 * 60 * 1000,
          });

          console.log("Just refreshed the refesh token");
        }

        // Always issue a new access token
        const newAccessToken = generateAccessToken(user?._id.toString());
        res.cookie('token', newAccessToken, {
          httpOnly: true,
          sameSite: 'none',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        console.log("Just refreshed the Access token");
        

        req.user = user;
        next();
      } catch (refreshErr) {
        console.log("Error in Middleware");
        res.status(401).json({ message: 'Session expired. Please login again.' });
        return;
      }
    }

    res.status(401).json({ message: 'Invalid or expired token' });
    return;
  }
};
