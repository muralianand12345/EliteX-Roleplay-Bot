const {
    ChannelType,
    Events
} = require('discord.js');

const discordTranscripts = require('discord-html-transcripts');
require("dotenv").config();
const fs = require('fs');
const path = require('path');

module.exports = {
    name: Events.ClientReady,
    async execute(client) {

        if (client.config.ENABLE.AUTOTICKET == true) {

            const GuildID = client.config.GUILD_ID;
            const Interval = 10800000;
            const Guild = client.guilds.cache.get(GuildID);

            setInterval(async () => {
                try {
                    const ticketChannels = Guild.channels.cache.filter((chan) =>
                        chan.name.includes('ticket') && chan.type === ChannelType.GuildText
                    );

                    const ticketLogDir = path.join(__dirname, '../website/ticket-logs');

                    await ticketChannels.forEach(async (chan) => {
                        const htmlCode = await discordTranscripts.createTranscript(chan, {
                            limit: -1,
                            returnType: 'string',
                            filename: `transcript-${chan.id}.html`,
                            saveImages: false,
                            poweredBy: false,
                        });

                        fs.writeFile(`${ticketLogDir}/transcript-${chan.id}.html`, htmlCode, (err) => {
                            if (err) {
                                console.error(err);
                            } else {
                                console.log(`Transcript saved for channel: ${chan.name}`);
                            }
                        });
                    });
                } catch (error) {
                    console.error(error);
                }
            }, Interval);
        }
    }
};