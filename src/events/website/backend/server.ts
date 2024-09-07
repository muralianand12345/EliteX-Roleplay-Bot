import express from 'express';
import { config } from 'dotenv';
import { Events } from 'discord.js';
import path from 'path';
import cors from 'cors';
import ai_api from './routes/ai_api';
import fivem_api from './routes/fivem_api';
import { ensureHttps } from './middlewares/auth';
import { aiChatLimiter } from './middlewares/rate_limit';

import { BotEvent } from '../../../types';

const allowedOrigins = ['https://muralianand.in', 'https://www.muralianand.in', 'https://elitexticket.muralianand.in'];

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

        app.use('/api/v1/ai', ensureHttps, aiChatLimiter);
        app.use('/api/v1/ai', ai_api);
        app.use('/api/v1/fivem', fivem_api);

        app.get('/', (req, res) => {
            res.send('EliteX Roleplay Bot');
        });

        app.use(express.static(ticketLogDir));

        app.listen(Port);
    }
};

export default event;