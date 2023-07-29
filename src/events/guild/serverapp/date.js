const moment = require('moment');
const tz = require('moment-timezone');
const {
    Events
} = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    async execute(client) {

        //Date
        const needDatenTime = client.config.ENABLE.DATE;

        if (needDatenTime == true) {
            const TIMEZONE = client.date.TIMEZONE;
            const FORMAT = client.date.FORMATDATE;
            const CHANNEL_ID = client.date.CHAN_ID;
            const UPDATE_INTERVAL = client.date.UPDATE_INTERVAL;

            const timeNow = moment().tz(TIMEZONE).format(FORMAT);
            const clockChannel = client.channels.cache.get(CHANNEL_ID);
            await clockChannel.edit({ name: `🕒 ${timeNow}` }, 'Clock update').catch(console.error);

            setInterval(async () => {
                const timeNowUpdate = moment().tz(TIMEZONE).format(FORMAT);
                await clockChannel.edit({ name: `🕒 ${timeNowUpdate}` }, 'Clock update').catch(console.error);
            }, UPDATE_INTERVAL);

        }
    }
}