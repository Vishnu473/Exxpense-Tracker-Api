import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { hashPassword, comparePassword } from '../utils/hash.utils';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt.utils';

import { IUser } from '../interfaces/user.interface';
import jwt, { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { CategoryModel } from '../models/category.model';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password } = req.body;
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'Email already exists' });
      return;
    }

    const hashed = await hashPassword(password);
    const user = await UserModel.create({ name, email, phone, password: hashed });
    
    await createSavingsCategory(user?._id);

    const token = generateAccessToken(user._id.toString());
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7* 24 * 60 * 60 * 1000,
    });

    const newRefreshToken = generateRefreshToken(user?._id.toString());
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      sameSite: 'none',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 21 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ user: { name: user.name, email: user.email, phone: user.phone }, "message": " Registration successful" });
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to register user', error });
    console.log(error);
    
    return;
  }
};

const createSavingsCategory = async(id:mongoose.Types.ObjectId) => {
  try {
    await CategoryModel.create({
      name:'Other',
      type:'saving',
      user:id,
      isUserDefined: false
    })
  } catch (error) {
    console.log("Creating pre-defined category for a user",error);
  }
}

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }
    if (!user.password) {
      res.status(500).json({ message: 'User password is missing or corrupted.' });
      return;
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const token = generateAccessToken(user._id.toString());
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    const newRefreshToken = generateRefreshToken(user?._id.toString());
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      sameSite: 'none',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 21 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ user: { name: user.name, email: user.email, phone: user.phone }, message: 'LoggedIn successfully' });
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to login user', error });
    return;
  }
};

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    res.status(401).json({ message: 'No refresh token' });
    return;
  }

  try {
    const decoded = verifyToken(token) as JwtPayload;

    const newAccessToken = generateAccessToken(decoded.userId);
    res.cookie('token', newAccessToken, { httpOnly: true, sameSite: 'none', secure: false });

    // Rotate refresh token if near expiry
    if (typeof decoded.exp === 'number') {
      const expiresInMs = decoded.exp * 1000 - Date.now();
      if (expiresInMs < 3 * 60 * 1000) {
        const newRefreshToken = generateRefreshToken(decoded.userId);
        res.cookie('refreshToken', newRefreshToken, { httpOnly: true, sameSite: 'none', secure: false });
      }
    }

    res.status(200).json({ message: 'Refreshed' });
  } catch (err) {
    console.log('Refresh failed:', err);
    res.status(401).json({ message: 'Refresh token expired' });
    return;
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { name, email, phone } = req.body;
    const userId = req.user?._id;
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const updateData: Partial<IUser> = { name, email, phone };
    const updated = await UserModel.findByIdAndUpdate(userId, updateData, { new: true }).select("-password -bankAccounts");

    res.status(200).json(updated);
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ message: 'Failed to update the user', error })
  }
};

export const addBankAccount = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const userId = req.user?._id;

    const updated = await UserModel.findByIdAndUpdate(
      userId,
      { $addToSet: { bankAccounts: name.trim() } },
      { new: true }
    );
    res.status(200).json({ message: 'Bank account added', bankAccounts: updated?.bankAccounts });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add bank account', error });
  }
};

export const renameBankAccount = async (req: Request, res: Response) => {
  try {
    const { oldName, newName } = req.body;
    const userId = req.user?._id;

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    if (oldName === newName) {
      res.status(400).json({ message: 'OldName and newName are both same' });
      return;
    }
    const index = user.bankAccounts.indexOf(oldName);
    if (index === -1) {
      res.status(404).json({ message: 'Old bank account not found' });
      return;
    }
    if (user.bankAccounts.indexOf(newName) !== -1) {
      res.status(400).json({ message: 'bank account with that name is already available. Enter last 4 digits to differentiate.' });
      return;
    }
    user.bankAccounts[index] = newName;
    await user.save();

    res.status(200).json({ message: 'Bank account renamed', bankAccounts: user.bankAccounts });

    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to rename bank account', error });
    return;
  }
};

export const removeBankAccount = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const userId = req.user?._id;

    const updated = await UserModel.findByIdAndUpdate(
      userId,
      { $pull: { bankAccounts: name.trim() } },
      { new: true }
    );
    res.status(200).json({ message: `Bank account-${name} removed`, bankAccounts: updated?.bankAccounts });
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove bank account', error });
    return;
  }
};

export const getPaymentSources = async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findById(req.user?._id).select('bankAccounts');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      bankAccounts: user.bankAccounts || [],
    });
    return;
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve payment sources', error });
    return;
  }
};

export const logoutUser = (req: Request, res: Response) => {
  try {
    res.clearCookie('token');
    res.clearCookie('refreshToken').json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to logout', error });
    return;
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get the user details', error });
    return;
  }
};
