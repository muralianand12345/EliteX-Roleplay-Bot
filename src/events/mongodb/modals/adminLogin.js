const { Schema, model } = require('mongoose');

const userSchema = Schema({
    discordId: String,
    discordUsername: String,
    discordAvatar: String
});

module.exports = model('ticket-admin', userSchema);