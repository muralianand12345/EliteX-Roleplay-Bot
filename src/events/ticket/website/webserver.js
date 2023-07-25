var express = require('express');
var app = express(); 
require("dotenv").config();
const {
    Events
} = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: Events.ClientReady,
    async execute(client) {
        const Port = process.env.PORT;

        const ticketLogDir = path.join(__dirname, './ticket-logs');
        //app.use(require('morgan')('dev'));
        app.use(express.static(ticketLogDir));
        app.listen(Port);
    }
}