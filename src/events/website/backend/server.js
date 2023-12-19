const express = require('express');
const app = express();
app.set('trust proxy', 1);
require("dotenv").config();
const { Events } = require('discord.js');

const path = require('path');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const { checkLoggedIn, checkSuperAdmin } = require('./functions/function.js');

module.exports = {
    name: Events.ClientReady,
    async execute(client) {

        const Port = process.env.PORT;

        app.use(express.json());
        app.use('/css', express.static(path.join(__dirname, '../frontend', 'css')));
        app.use('/js', express.static(path.join(__dirname, '../frontend', 'js')));

        const corsOptions = {
            origin: ['https://iconicticket.muralianand.in',
                'https://muralianand.in',
                'http://localhost:5002'],
            methods: 'GET,POST',
            optionsSuccessStatus: 204,
        };
        app.use(cors(corsOptions));

        const ticketLogDir = path.join(__dirname, '../ticket-logs');
        app.use(express.static(ticketLogDir));

        const secretKey = uuidv4();
        app.use(session({
            secret: secretKey,
            resave: false,
            saveUninitialized: true,
            cookie: {
                secure: true
            },
        }));

        /*const rageMP = require('./route/rage/ragemp.js');
        app.use('/rage', rageMP);*/

        app.get('/logout', (req, res) => {
            req.session.isLoggedIn = false;
            res.redirect('/login');
        });

        app.get('/error', checkLoggedIn, (req, res) => {
            res.sendFile(path.join(__dirname, '../frontend', 'error.html'));
        });

        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
        });

        app.listen(Port);
    }
};
