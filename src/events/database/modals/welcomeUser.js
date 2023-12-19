const { Schema, model } = require('mongoose');

const welcomeUser = Schema({
    guildId: { type: String, required: true },
    welcomeChanId: { type: String, required: false },
    goodbyeChanId: { type: String, required: false },
    welcomeMsg: {
        description: { type: String, required: false },
        forLinks: { type: String, required: false },
        fields: [{
            name: { type: String, required: false },
            value: { type: String, required: false },
        }]
    }

});

module.exports = model('welcome-user', welcomeUser);