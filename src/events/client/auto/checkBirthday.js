const { Events, EmbedBuilder } = require('discord.js');
const schedule = require('node-schedule');
const moment = require('moment-timezone');

const birthdayModel = require("../../mongodb/modals/birthday.js");

module.exports = {
    name: Events.ClientReady,
    async execute(client) {
        schedule.scheduleJob('0 0 * * *', async function () {
        //schedule.scheduleJob('*/10 * * * * *', async function () {
            console.log("Checking for birthdays");
            const now = moment().tz("UTC");

            var usersWithBirthdayToday = await birthdayModel.find({
                day: now.tz("Asia/Kolkata").date(),
                month: now.tz("Asia/Kolkata").month() + 1,
            });

            var embed = new EmbedBuilder()
                .setColor('Blurple');

            if (usersWithBirthdayToday.length > 0) {
                const channel = client.channels.cache.get('1151811052674220042');
                usersWithBirthdayToday.forEach(async (user) => {
                    console.log(`Wishing ${user.userID} a happy birthday!`)
                    try {
                        const userBirthday = moment(user.birthday).tz("UTC");

                        if (userBirthday.format("MM-DD") === now.clone().tz("Asia/Kolkata").format("MM-DD")) {
                            embed.setDescription(`**Happy Birthday** <@${user.userID}>**!** 🎉🎂`);
                            await channel.send({ embeds: [embed] });
                        }
                    } catch (error) {
                        console.error(`Error sending birthday wishes: ${error}`);
                    }
                });
            }
        });
    }
};
