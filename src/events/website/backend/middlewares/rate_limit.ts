import rateLimit from 'express-rate-limit';

const aiChatLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Too many AI chat requests, please try again later.'
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, please try again later.'
});

export { aiChatLimiter, loginLimiter };