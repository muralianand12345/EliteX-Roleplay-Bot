const { Schema, model } = require('mongoose');

const blockusers = new Schema({
    guildId: String,
    userId: String,
    event: String,
    block: Boolean,
    count: Number,
    expirationDate: Date
});

module.exports = new model('Block-Users', blockusers)