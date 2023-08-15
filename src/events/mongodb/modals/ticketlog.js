const { Schema, model } = require('mongoose');

const ticketLog = Schema({
    guildID: String,
    userID: String,
    count: Number,
    ticketlog: [{
        ticketNumber: { type: Number, required: true },
        ticketId: { type: String, required: true },
        transcriptLink: { type: String, required: true },
    }],
});

module.exports = model('ticket-log', ticketLog);