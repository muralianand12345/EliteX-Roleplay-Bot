import express from 'express';
import { config } from 'dotenv';
import { Events } from 'discord.js';
import path from 'path';
import cors from 'cors';
import ai_api from './routes/ai_api';
import { ensureHttps } from './middlewares/auth';
import { aiChatLimiter } from './middlewares/rate_limit';

import { BotEvent } from '../../../types';

const allowedOrigins = ['https://muralianand.in', 'https://www.muralianand.in', 'https://ticket.iconicrp.in'];

const corsOptions: cors.CorsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS']
};

const app = express();
app.set('trust proxy', 1);
config();

const event: BotEvent = {
    name: Events.ClientReady,
    async execute(client) {

        const Port = process.env.PORT;

        app.use(cors(corsOptions));
        app.use(express.json());

        const ticketLogDir = path.join(__dirname, '../../../../ticket-logs');

        app.use('/api', ensureHttps);
        app.use('/api/v1/ai', aiChatLimiter);
        app.use('/api/v1/ai', ai_api);

        app.use(express.static(ticketLogDir));

        app.listen(Port);
    }
};

export default event;