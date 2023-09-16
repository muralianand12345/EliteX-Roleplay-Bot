const { Events } = require('discord.js');
const schedule = require('node-schedule');
const moment = require('moment-timezone'); // Import the moment-timezone library

const birthdayModel = require("../../mongodb/modals/birthday.js");

module.exports = {
    name: Events.ClientReady,
    async execute(client) {
        schedule.scheduleJob('10 0 * * *', async function () {
            const now = moment().tz("UTC"); // Get the current UTC time
            const today = now.clone().startOf('day'); // Start of the current UTC day

            var usersWithBirthdayToday = await birthdayModel.find({
                birthday: {
                    $gte: today.toDate(), // Convert to Date object
                    $lt: today.clone().add(1, 'day').toDate() // Add 1 day and convert to Date object
                }
            });

            if (usersWithBirthdayToday.length > 0) {
                const channel = client.channels.cache.get('1151811052674220042');
                usersWithBirthdayToday.forEach(async (user) => {
                    try {
                        const userBirthday = moment(user.birthday).tz("UTC"); // Convert user's birthday to UTC
                        const formattedBirthday = userBirthday.clone().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"); // Format in Asia/Kolkata timezone
                        await channel.send(`Happy Birthday <@${user.userID}>! 🎉🎂 (UTC: ${formattedBirthday} IST)`);
                    } catch (error) {
                        console.error(`Error sending birthday wishes: ${error}`);
                    }
                });
            }
        });
    }
};
