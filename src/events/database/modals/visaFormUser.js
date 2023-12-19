const { Schema, model } = require('mongoose');

const visaAppUser = Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    rockstarId: { type: String, required: false },
    answer: [{
        question: { type: String, required: false },
        answer: { type: String, required: false },
    }],
    active: { type: Boolean, default: false, required: true },
});

module.exports = model('visa-user', visaAppUser);