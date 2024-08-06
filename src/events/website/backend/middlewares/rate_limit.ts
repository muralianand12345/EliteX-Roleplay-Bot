import rateLimit from 'express-rate-limit';

const aiChatLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Too many AI chat requests, please try again later.'
});

export { aiChatLimiter };