const { Schema, model } = require('mongoose');

const tileWar = Schema({
    guildID: { type: String, required: true },
    currenlyWar: [{
        gang1: { type: String, required: true },
        gang2: { type: String, required: true },
        pannelID: { type: String, default: "Still Pending", required: true },
        requestPannelID: { type: String, required: true },
        waractive: { type: Boolean, default: false, required: true },
        warRequestedDate: { type: Date, default: Date.now(), required: true },
        warDate: { type: String, required: true },
        timing: { type: String, required: true },
    }],
    count: [{
        gang: { type: String, required: true },
        wins: { type: Number, default: 0, required: false },
        totalwar: { type: Number, default: 1, required: false },
    }],
});

module.exports = model('tile-war', tileWar);