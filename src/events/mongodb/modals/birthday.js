const { Schema, model } = require('mongoose');

const birthdaySchema = Schema({
    userID: String,
    birthday: Date
});

module.exports = model('birthday', birthdaySchema);