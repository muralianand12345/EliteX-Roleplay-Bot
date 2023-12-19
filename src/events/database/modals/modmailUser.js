const { Schema, model } = require('mongoose');

const modmail = Schema({
    userID: { type: String, required: true },
    status: { type: Boolean, default: true, required: true },
    threadID: { type: String, required: true},
    count: { type: Number, default: 0, required: true },
});

module.exports = model('modmail-user', modmail);