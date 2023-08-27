const { Schema, model } = require('mongoose');

const count = Schema({
    guildID: String,
    darkChatCount: Number
});

module.exports = model('app-count', count);