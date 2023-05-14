const { Schema, model } = require('mongoose');

const guild = Schema({
    guildID: String,
    memCount: Number
});

module.exports = model('mem-count', guild);