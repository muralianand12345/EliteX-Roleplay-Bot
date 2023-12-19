const { Events, EmbedBuilder, WebhookClient } = require('discord.js');
const schedule = require('node-schedule');
const moment = require('moment-timezone');

const birthdayModel = require("../../database/modals/birthday.js");

module.exports = {
    name: Events.ClientReady,
    async execute(client) {

        if (!client.config.birthday.enabled) return;

        schedule.scheduleJob(client.config.birthday.wishat, async function () {

            const now = moment().tz("UTC");

            var usersWithBirthdayToday = await birthdayModel.find({
                day: now.tz(client.config.birthday.timezone).date(),
                month: now.tz(client.config.birthday.timezone).month() + 1,
            });

            var embed = new EmbedBuilder()
                .setColor('Blurple');

            const webhookList = client.config.birthday.webhooks;
            await webhookList.forEach(async (webhook) => {
                const webhookChan = new WebhookClient({ url: webhook });

                if (usersWithBirthdayToday.length > 0) {
                    usersWithBirthdayToday.forEach(async (user) => {
                        try {
                            embed.setDescription(`**Happy Birthday** <@${user.userID}>**!** 🎉🎂`);
                            webhookChan.send({
                                username: `${client.user.username}`,
                                avatarURL: `${client.user.displayAvatarURL()}`,
                                embeds: [embed]
                            })
                        } catch (error) {
                            client.logger.error(`Error sending birthday wishes: ${error}`);
                        }
                    });
                }
            });
        });
    }
};
