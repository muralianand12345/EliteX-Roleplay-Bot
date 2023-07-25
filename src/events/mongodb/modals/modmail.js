const { Schema, model } = require('mongoose');

const guild = Schema({
    userID: String,
    status: Boolean,
    threadID: String,
    count: Number
});

module.exports = model('modmail-user', guild);