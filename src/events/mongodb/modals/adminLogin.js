const { Schema, model } = require('mongoose');

const userSchema = Schema({
    username: String,
    password: String,
});

module.exports = model('ticket-admin', userSchema);