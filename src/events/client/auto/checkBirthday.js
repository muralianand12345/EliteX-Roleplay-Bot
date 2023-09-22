const { Events, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const schedule = require('node-schedule');
const moment = require('moment-timezone');

const birthdayModel = require("../../mongodb/modals/birthday.js");

module.exports = {
    name: Events.ClientReady,
    async execute(client) {
        schedule.scheduleJob('5 0 * * *', async function () {

            const channel = client.channels.cache.get('1109438179603402762');

            if (!channel) {
                console.error(`Channel with ID 1109438179603402762 not found`);
                return;
            }

            if (!channel.permissionsFor(client.user).has(PermissionFlagsBits.SendMessages)) {
                console.error(`Bot does not have permission to send messages in channel ${channel.name}`);
                return;
            }

            const now = moment().tz("UTC");

            var usersWithBirthdayToday = await birthdayModel.find({
                day: now.tz("Asia/Kolkata").date(),
                month: now.tz("Asia/Kolkata").month() + 1,
            });

            var embed = new EmbedBuilder()
                .setColor('Blurple');

            if (usersWithBirthdayToday.length > 0) {
                usersWithBirthdayToday.forEach(async (user) => {
                    try {
                        embed.setDescription(`**Happy Birthday** <@${user.userID}>**!** 🎉🎂`);
                        await channel.send({ embeds: [embed] });
                    } catch (error) {
                        console.error(`Error sending birthday wishes: ${error}`);
                    }
                });
            }
        });
    }
};
