const { Schema, model } = require('mongoose');

const channelSchema = new Schema({
    ticketGuildID: String,
    ticketChannelID: String,
    ticketSupportID: String,
    ticketLogChannelID: String
});

module.exports = new model('Ticket-Channels', channelSchema)