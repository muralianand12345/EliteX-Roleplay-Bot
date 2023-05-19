const { Schema, model } = require('mongoose');

const serverStat = Schema({
    guildID: String,
    guildName: String,
    chanID: String,
    totalMemberCount: String,
});

module.exports = model('server-stats', serverStat);