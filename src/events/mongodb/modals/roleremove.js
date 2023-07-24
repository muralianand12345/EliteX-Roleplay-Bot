const { Schema, model } = require('mongoose');

const roleRemove = new Schema({
    userId: String,
    roleId: String,
    expirationDate: Date,
    guildId: String
});

module.exports = new model('role-timer', roleRemove);