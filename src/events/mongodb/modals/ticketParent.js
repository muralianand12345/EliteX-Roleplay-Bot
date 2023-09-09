const { Schema, model } = require('mongoose');

const ticketParent = Schema({
    guildID: String,
    oocPar: String,
    suppPar: String,
    /*combatPar: String,
    bugPar: String,
    charPar: String,*/
    otherPar: String,
    closedPar: String
});

module.exports = model('ticket-par', ticketParent);