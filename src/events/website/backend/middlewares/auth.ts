import express from 'express';
import { Request, Response, NextFunction } from 'express';

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

export { authenticate, ensureHttps };