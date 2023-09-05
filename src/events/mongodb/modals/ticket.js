const { Schema, model } = require('mongoose');

const ticket = Schema({
    guildID: String,
    userID: String,
    ticketRecentID: String,
    ticketCount: Number,
    ticketLimit: Number,
    ticketData: [{
        ticketID: { type: String, required: true },
        ticketPannelID: { type: String, required: true }
    }]
});

module.exports = model('ticket-main', ticket);