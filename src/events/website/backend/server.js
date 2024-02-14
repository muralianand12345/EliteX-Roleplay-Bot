const express = require('express');
const app = express();
app.set('trust proxy', 1);
require("dotenv").config();
const { Events } = require('discord.js');

const path = require('path');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const { checkLoggedIn } = require('./functions/function.js');

module.exports = {
    name: Events.ClientReady,
    async execute(client) {

        const Port = process.env.PORT;

        app.use(express.json());
        app.use('/css', express.static(path.join(__dirname, '../frontend', 'css')));
        app.use('/js', express.static(path.join(__dirname, '../frontend', 'js')));

        const allowedOrigins = ['https://iconicticket.muralianand.in', 'https://muralianand.in', 'http://localhost:6969'];
        const corsOptions = {
            origin: function (origin, callback) {
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(client.logger.error(`Not allowed by CORS ${origin}`));
                }
            },
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
                secure: false
            },
        }));

        const imageDir = path.join(__dirname, 'images');
        app.use('/assets/images', express.static(imageDir));

        const apiRoutes = require('./routes/app/api.js');
        app.use('/', apiRoutes);
        const authRoutes = require('./routes/app/auth.js');
        app.use('/auth', authRoutes);

        app.get('/logout', (req, res) => {
            req.session.isLoggedIn = false;
            res.redirect('/');
        });

        app.get('/error', checkLoggedIn, (req, res) => {
            res.sendFile(path.join(__dirname, '../frontend', 'error.html'));
        });

        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
        });

        app.get('/home', checkLoggedIn, (req, res) => {
            res.send(`The home page is under development, Thank you for logging in, we will let you know once it is ready.`);
            //res.sendFile(path.join(__dirname, '../frontend', 'home.html'));
        });

        app.listen(Port);
    }
};
