const { Events, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const schedule = require('node-schedule');
const moment = require('moment-timezone');

const birthdayModel = require("../../mongodb/modals/birthday.js");

module.exports = {
    name: Events.ClientReady,
    async execute(client) {
        schedule.scheduleJob(client.auto.BIRTHDAY.WISHAT, async function () {

            const channel = client.channels.cache.get(client.auto.BIRTHDAY.WISHCHAN);

            if (!channel) {
                console.error(`Channel not found`);
                return;
            }

            if (!channel.permissionsFor(client.user).has(PermissionFlagsBits.SendMessages)) {
                console.error(`Bot does not have permission to send messages in channel ${channel.name}`);
                return;
            }

            const now = moment().tz("UTC");

            var usersWithBirthdayToday = await birthdayModel.find({
                day: now.tz(client.auto.BIRTHDAY.TIMEZONE).date(),
                month: now.tz(client.auto.BIRTHDAY.TIMEZONE).month() + 1,
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
