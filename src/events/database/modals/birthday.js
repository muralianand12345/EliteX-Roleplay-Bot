const { Schema, model } = require('mongoose');

const birthdaySchema = Schema({
    userID: { type: String, required: true },
    day: { type: Number, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: false },
    age: { type: Number , required: false }
});

module.exports = model('birthday', birthdaySchema);