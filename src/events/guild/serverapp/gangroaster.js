const {
    PermissionFlagsBits,
    Events
} = require('discord.js');
const schedule = require('node-schedule');

module.exports = {
    name: Events.ClientReady,
    async execute(client) {

        async function GangRoaster() {

            const date = new Date();
            const currDay = new Intl.DateTimeFormat('en-IN', { dateStyle: 'full', timeStyle: 'long', timeZone: 'Asia/Kolkata' }).format(date);

            const gangID = client.auto.ROSTER.GANGLEADERID;
            const prID = client.auto.ROSTER.PRID;
            const channelName = client.auto.ROSTER.CHANNAME;
            const GuildID = client.config.GUILD_ID;
            const ChanID = client.auto.ROSTER.CHANID;

            if (currDay.includes('Saturday')) {
                const Guild = client.guilds.cache.get(GuildID)
                const chan = client.channels.cache.get(ChanID);
                await chan.edit({
                    name: `${channelName}`,
                    topic: `Will be open only on Saturdays (automatically by bots)`,
                    permissionOverwrites: [
                        {
                            id: Guild.roles.cache.find(role => role.id == gangID),
                            allow: [
                                PermissionFlagsBits.SendMessages,
                            ]
                        },
                        {
                            id: Guild.roles.cache.find(role => role.id == prID),
                            allow: [
                                PermissionFlagsBits.ViewChannel
                            ]
                        },
                        {
                            id: Guild.roles.everyone,
                            deny: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.CreatePublicThreads,
                                PermissionFlagsBits.AddReactions,
                                PermissionFlagsBits.MentionEveryone,
                                PermissionFlagsBits.UseApplicationCommands,
                                PermissionFlagsBits.ReadMessageHistory
                            ]
                        }
                    ]
                });
            } else {
                const Guild = client.guilds.cache.get(GuildID)
                const chan = client.channels.cache.get(ChanID);
                await chan.edit({
                    name: `${channelName}-ᴄʟᴏꜱᴇᴅ`,
                    topic: `Will be open only on Saturdays (automatically by bots)`,
                    permissionOverwrites: [
                        {
                            id: Guild.roles.cache.find(role => role.id == gangID),
                            deny: [
                                PermissionFlagsBits.SendMessages
                            ]
                        },
                        {
                            id: Guild.roles.cache.find(role => role.id == prID),
                            allow: [
                                PermissionFlagsBits.ViewChannel
                            ]
                        },
                        {
                            id: Guild.roles.everyone,
                            deny: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.CreatePublicThreads,
                                PermissionFlagsBits.AddReactions,
                                PermissionFlagsBits.MentionEveryone,
                                PermissionFlagsBits.UseApplicationCommands,
                                PermissionFlagsBits.ReadMessageHistory
                            ]
                        }
                    ]
                });
            }
        }

        if (client.config.ENABLE.GANGROSTER === true) {
            schedule.scheduleJob("5 0 * * *", async function () {
                await GangRoaster();
            });
        }
    }
}