const { Schema, model } = require('mongoose');

const modmail = Schema({
    guildID: { type: String, required: true },
    status: { type: Boolean, default: true, required: true },
    above18: { type: String, required: true },
    below18: { type: String, required: true },
    count: { type: Number, default: 0, required: true },
});

module.exports = model('age-declaration', modmail);

/*{
    "guildID": "1115161694335930508",
    "status": true,
    "above18": "1132237249031983125",
    "below18": "1132237268996853770"
}*/