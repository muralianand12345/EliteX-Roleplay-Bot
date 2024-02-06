const { Schema, model } = require('mongoose');

const ticket = Schema({
    userID: { type: String, required: true },
    recentTicketID: { type: String, required: false },
    ticketlog: [{
        guildID: { type: String, required: true },
        activeStatus: { type: Boolean, default: true, required: true },
        ticketNumber: { type: Number, required: true },
        ticketId: { type: String, required: true },
        transcriptLink: { type: String, required: false },
        ticketPannelId: { type: String, required: true },
    }],
});

module.exports = model('ticket-user', ticket);