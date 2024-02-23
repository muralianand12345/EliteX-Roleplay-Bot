const { Schema, model } = require('mongoose');

const bannedUsers = new Schema({
    userId: { type: String, required: true },
    ban: [{
        bantype: { type: String, required: true },
        keyWord: { type: String, required: true },
        status: { type: Boolean, required: true },
        reason: { type: String, required: false },
    }],
});

module.exports = model('bannedUsers', bannedUsers);