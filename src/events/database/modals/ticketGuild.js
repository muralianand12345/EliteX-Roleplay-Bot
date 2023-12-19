const { Schema, model } = require('mongoose');

const ticket = Schema({
    guildID: { type: String, required: true },
    category: [{
        label: { type: String, required: false },
        value: { type: String, required: false },
        emoji: { type: String, required: false },
    }],
    closedPar: { type: String, required: false },
    ticketMaxCount: { type: Number, default: 2, required: false },
    ticketCount: { type: Number, default: 0, required: false },
    ticketSupportID: { type: String, required: false },
    ticketLogID: { type: String, required: false },
    ticketStatus: { type: Boolean, default: false, required: true },
});

module.exports = model('ticket-guild', ticket);