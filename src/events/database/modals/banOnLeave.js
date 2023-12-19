const { Schema, model } = require('mongoose');

const banonleave = Schema({
    guildID: { type: String, required: true },
    status: { type: Boolean, default: true, required: true },
    chanID: { type: String, required: true },
    single: { type: Boolean, default: true, required: true },
    type: { type: String, default: "message", required: true },
    action: { type: String, default: "ban", required: true },
    roles: [{ roleID: { type: String, required: true } }],
    count: { type: Number, default: 0, required: true },
});

module.exports = model('banoneleave-guild', banonleave);