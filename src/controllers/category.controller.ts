import { Request, Response } from 'express';
import { CategoryModel } from '../models/category.model';
import { ICategory } from '../interfaces/category.interface';

export const createCategory = async (req: Request, res: Response) => {
    try {
        const { name, type } = req.body;

        if (!req.user || !req.user._id) {
            res.status(401).json({ message: 'Unauthorized: user not found' });
            return;
        }
        const newCategory: Partial<ICategory> = {
            name,
            type,
            user: req?.user?._id,
            isUserDefined: true,
        };

        const category = await CategoryModel.create(newCategory);
        res.status(201).json(category);
        return;
    } catch (error) {
        console.error('Error creating categories ', error);
        res.status(500).json({ message: 'Failed to create a category' });
        return;
    }
};

export const getCategories = async (req: Request, res: Response) => {
    try {
        const predefined = await CategoryModel.find({ isUserDefined: false });
        const userDefined = await CategoryModel.find({ user: req?.user?._id, isUserDefined: true });
        res.status(200).json([...userDefined, ...predefined,]);
    } catch (error) {
        console.error('Error retrieving category items ', error);
        res.status(500).json({ message: 'Failed to retrieve categories ' });
        return;
    }
};

export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const category = await CategoryModel.findOneAndUpdate(
            { _id: id, user: req?.user?._id, isUserDefined: true },
            req.body,
            { new: true }
        );
        if (!category) {
            res.status(404).json({ message: 'Category is invalid or not editable' });
            return;
        }
        res.status(200).json(category);
        return;
    } catch (error) {
        console.error('Error updating a category ', error);
        res.status(500).json({ message: 'Failed to update a category ' });
        return;
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const category = await CategoryModel.findOneAndDelete({
            _id: id,
            user: req?.user?._id,
            isUserDefined: true,
        });
        if (!category) {
            res.status(404).json({ message: 'Category is invalid or not deletable' });
            return;
        }
        res.status(200).json({ message: `Category-${category.name} deleted` });
        return;
    } catch (error) {
        console.error('Error deleting category ', error);
        res.status(500).json({ message: 'Failed to delete a category ' });
        return;
    }
};
