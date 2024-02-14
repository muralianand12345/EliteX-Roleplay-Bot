const { Schema, model } = require('mongoose');

const userSchema = Schema({
    discordId: { type: String, required: true },
    discordUsername: { type: String, required: true },
    discordAvatar: { type: String, required: true },
    email: { type: String, default: "no-email", required: false } 
});

module.exports = model('user-web-login', userSchema);