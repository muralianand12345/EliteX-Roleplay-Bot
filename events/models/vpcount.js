const { Schema, model } = require('mongoose');

const guild = Schema({
    guildID: String,
    vpCount: Number
});

module.exports = model('vp-count', guild);