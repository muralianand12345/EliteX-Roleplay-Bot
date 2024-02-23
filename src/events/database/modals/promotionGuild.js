const { Schema, model } = require('mongoose');

const promotionGuild = new Schema({
    guildId: { type: String, required: true },
    channelId: [{ type: String, required: true }],
    blockedList: [{ type: String, required: false }],
    blockedUsers: [{
        userId: { type: String, required: false },
        count: { type: Number, default: 0 },
        contents: [{
            content: { type: String, required: false },
        }],
    }],
    count: { type: Number, default: 0 },
});

module.exports = model('promotionGuild', promotionGuild);