const { Schema, model } = require('mongoose');

const userSchema = Schema({
    discordId: String,
    discordUsername: String,
    discordAvatar: String
});

module.exports = model('user-web-login', userSchema);