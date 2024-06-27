import { Events, EmbedBuilder, WebhookClient } from 'discord.js';
import { scheduleJob } from 'node-schedule';
import moment from 'moment-timezone';

import { BotEvent } from "../../../types";
import birthdayModel from "../../database/schema/birthday";

const event: BotEvent = {
    name: Events.ClientReady,
    async execute(client) {

        if (!client.config.birthday.enabled) return;

        scheduleJob(client.config.birthday.wishat, async () => {
            const now = moment().tz("UTC");

            var usersWithBirthdayToday = await birthdayModel.find({
                day: now.tz(client.config.birthday.timezone).date(),
                month: now.tz(client.config.birthday.timezone).month() + 1,
            });

            var embed = new EmbedBuilder()
                .setColor('Blurple');

            const webhookList = client.config.birthday.webhooks;
            await webhookList.forEach(async (webhook: string) => {
                const webhookChan = new WebhookClient({ url: webhook });

                if (usersWithBirthdayToday.length > 0) {
                    usersWithBirthdayToday.forEach(async (user) => {
                        try {
                            const guild = client.guilds.cache.get(client.config.birthday.guildId);
                            if (!guild) return;
                            const member = guild.members.cache.get(user.userId);
                            if (!member) return await birthdayModel.deleteOne({ userId: user.userId });

                            embed.setDescription(`**Happy Birthday** <@${user.userId}>**!** 🎉🎂`);
                            webhookChan.send({
                                username: `${client.user.username}`,
                                avatarURL: `${client.user.displayAvatarURL()}`,
                                embeds: [embed]
                            });

                            if (user.year) {
                                await birthdayModel.updateOne({ userId: user.userId }, { year: user.year + 1 });
                            }
                        } catch (error) {
                            client.logger.error(`Error sending birthday wishes: ${error}`);
                        }
                    });
                }
            });
        });
    }
};

export default event;