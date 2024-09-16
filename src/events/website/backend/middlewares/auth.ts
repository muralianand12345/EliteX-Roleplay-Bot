import express from 'express';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../../../types';

const JWT_SECRET = process.env.API_KEY;

const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.header('X-API-Key');  
    if (!apiKey || apiKey !== process.env.API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

const ensureHttps = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        next();
    } else {
        res.status(403).json({ error: 'HTTPS is required' });
    }
};

const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ error: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET!, (err: any, decoded: any) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        req.userId = decoded.id;
        next();
    });
};

export { authenticate, ensureHttps, verifyToken };