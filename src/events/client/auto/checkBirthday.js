const { Events } = require('discord.js');
const schedule = require('node-schedule');

const birthdayModel = require("../../mongodb/modals/birthday.js");

module.exports = {
    name: Events.ClientReady,
    async execute(client) {

        schedule.scheduleJob('10 0 * * *', async function () {
        //schedule.scheduleJob('*/10 * * * * *', async function () {

            const now = new Date();
            const timeZone = "Asia/Kolkata";
            const options = { timeZone: timeZone };
            const today = new Date(now.toLocaleString('en-US', options));

            var usersWithBirthdayToday = await birthdayModel.find({
                birthday: {
                    $gte: today,
                    $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
            });

            if (usersWithBirthdayToday.length > 0) {
                const channel = client.channels.cache.get('1151811052674220042');
                usersWithBirthdayToday.forEach(async (user) => {
                    try {
                        await channel.send(`Happy Birthday <@${user.userID}>! 🎉🎂`);
                    } catch (error) {
                        console.error(`Error sending birthday wishes: ${error}`);
                    }
                });
            }
        });
    }
}