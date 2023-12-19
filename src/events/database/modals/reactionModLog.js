const { Schema, model } = require('mongoose');

const reactionModLog = Schema({
    userId: { type: String, required: true },
    count: { type: Number, default: 0, required: true },
    logs: [{
        guildId: { type: String, required: true },
        channelId: { type: String, required: true },
        emoji: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
    }],
});

module.exports = model('reactionmod-guild', reactionModLog);