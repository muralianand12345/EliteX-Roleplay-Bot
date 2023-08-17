const express = require('express');
const app = express();
app.set('trust proxy', 1);
require("dotenv").config();
const { Events } = require('discord.js');

const path = require('path');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const { checkLoggedIn } = require('./route/functions.js');

module.exports = {
    name: Events.ClientReady,
    async execute(client) {

        const Port = process.env.PORT;

        // CSS JS JSON CORS -----------------------------------------------

        app.use(express.json());
        app.use('/css', express.static(path.join(__dirname, 'webpage', 'css')));
        app.use('/js', express.static(path.join(__dirname, 'webpage', 'js')));

        // CORS ------------------------------------------------------

        const corsOptions = {
            origin: ['https://iconicticket.muralianand.in',
                'https://muralianand.in',
                'http://localhost:5002'],
            methods: 'GET,POST',
            optionsSuccessStatus: 204,
        };
        app.use(cors(corsOptions));


        // Ticket File Count ------------------------------------------------------

        const ticketLogDir = path.join(__dirname, './ticket-logs');
        app.use(express.static(ticketLogDir));
        
        //LOGIN LOGIC --------------------------------------------------------------

        const secretKey = uuidv4();
        app.use(session({
            secret: secretKey,
            resave: false,
            saveUninitialized: true,
            cookie: { secure: false },
        }));

        //=================================================================================

        const authRoutes = require('./route/app/auth.js');
        const apiRoutes = require('./route/app/api.js');

        app.use('/', authRoutes);
        app.use('/', apiRoutes);

        // ================================================================================

        app.get('/logout', (req, res) => {
            req.session.isLoggedIn = false;
            res.redirect('/login');
        });

        app.get('/login', (req, res) => {
            res.sendFile(path.join(__dirname, 'webpage', 'login.html'));
        });

        app.get('/admin', checkLoggedIn, (req, res) => {
            res.sendFile(path.join(__dirname, 'webpage', 'admin.html'));
        });

        app.get('/ticket', checkLoggedIn, (req, res) => {
            res.sendFile(path.join(__dirname, 'webpage', 'ticket.html'));
        });

        app.get('/error', checkLoggedIn, (req, res) => {
            res.sendFile(path.join(__dirname, 'webpage', 'error.html'));
        });

        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'webpage', 'index.html'));
        });

        app.listen(Port);
    }
};
