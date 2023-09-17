const { Schema, model } = require('mongoose');

const birthdaySchema = Schema({
    userID: String,
    day: Number,
    month: Number,
});

module.exports = model('birthday', birthdaySchema);