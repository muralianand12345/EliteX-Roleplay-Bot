import express from 'express';
import { config } from 'dotenv';
import { Events } from 'discord.js';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import ai_api from './routes/ai_api';
import { ensureHttps } from './middlewares/auth';
import { aiChatLimiter } from './middlewares/rate_limit';

import { BotEvent } from '../../../types';


const corsOptions: cors.CorsOptions = {
    origin: ['https://muralianand.in', 'https://www.muralianand.in', 'https://ticket.iconicrp.in'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-API-Key']
};

const app = express();
app.set('trust proxy', 1);
config();

const event: BotEvent = {
    name: Events.ClientReady,
    async execute(client) {

        const Port = process.env.PORT;
        app.use(helmet());
        
        app.use('/api', cors(corsOptions));
        app.use(express.json());

        app.use(helmet.hsts({
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }));

        const ticketLogDir = path.join(__dirname, '../../../../ticket-logs');

        app.use('/api', ensureHttps);
        app.use('/api/v1/ai', aiChatLimiter);
        app.use('/api/v1/ai', ai_api);
    
        app.use(express.static(ticketLogDir));

        app.listen(Port);
    }
};

export default event;