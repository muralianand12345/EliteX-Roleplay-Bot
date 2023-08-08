const { Schema, model } = require('mongoose');

const userSchema = Schema({
    username: String,
    password: String,
    discordId: String,
    discordUsername: String,
    discordAvatar: String
});

module.exports = model('ticket-admin', userSchema);