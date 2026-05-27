import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import db from '../models';

const User = db.User as any;

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ message: "Email and password are required" });
            return;
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }

        if (!user.password_hash) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }

        // Return user info (excluding password hash)
        const userData = {
            id: user.id,
            name: user.name,
            full_name: user.full_name || user.name,
            email: user.email,
            role: user.role,
            contact_no: user.contact_no,
            products: user.products,
            instant_ids: user.instant_ids
        };

        // Also generate JWT token to be compliant with token auth
        const secret = process.env.JWT_SECRET || 'devsecret';
        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            secret,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            user: userData,
            accessToken: token
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

import jwt from 'jsonwebtoken';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, full_name, email, password, role, contact_no, products, instant_ids } = req.body;

        const finalName = name || full_name;

        if (!finalName || !email || !password) {
            res.status(400).json({ message: "Name, email, and password are required" });
            return;
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            res.status(400).json({ message: "Email already in use" });
            return;
        }

        const password_hash = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name: finalName,
            full_name: finalName,
            email,
            role: role || 'AgentL1',
            password_hash,
            contact_no,
            products: Array.isArray(products) ? products : undefined,
            instant_ids: typeof instant_ids === 'object' ? instant_ids : undefined,
            is_online: false
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser.id,
                name: newUser.name,
                full_name: newUser.full_name,
                email: newUser.email,
                role: newUser.role,
                contact_no: newUser.contact_no,
                products: newUser.products,
                instant_ids: newUser.instant_ids
            }
        });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
