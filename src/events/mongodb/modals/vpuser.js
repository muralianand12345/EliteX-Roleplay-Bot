const { Schema, model } = require('mongoose');

const vpUser = Schema({
    userID: String,
    VPTaken: Boolean,
    Response: Boolean,
    Form1: {
        Que1: String,
        Que2: String,
        Que3: String,
        Que4: String,
        Que5: String
    },
    Form2: {
        Que1: String,
        Que2: String,
        Que3: String,
        Que4: String,
        Que5: String
    },
    Form3: {
        Que1: String,
        Que2: String,
        Que3: String,
        Que4: String,
        Que5: String
    }
});

module.exports = model('vpuser', vpUser);