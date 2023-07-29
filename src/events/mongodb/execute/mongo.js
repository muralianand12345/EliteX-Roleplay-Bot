const {
    connect,
    set
} = require('mongoose');
const {
    Events
} = require('discord.js');
require("dotenv").config();
var colors = require('colors/safe');

module.exports = {
    name: Events.ClientReady,
    execute(client) {
        const dburl = process.env.DBURL;
        set('strictQuery', false);
        connect(dburl, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }).then(console.log(colors.green('MongoDB Connected')));
    }
}