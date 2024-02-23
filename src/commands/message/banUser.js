const { EmbedBuilder } = require('discord.js');

const bannedUsers = require('../../events/database/modals/bannedUsers.js');

module.exports = {
    name: 'banuser',
    description: 'Ban a user\s message from the server',
    cooldown: 1000,
    owner: true,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    async execute(client, message, args) {

        const userId = args[0];
        const banType = args[1];
        const keyWord = args[2];

        const banTypes = ['promotion'];

        if (!userId || !banType || !keyWord) {
            return await message.delete().then(async () => {
                await message.channel.send('Please provide a valid user id, ban type and keyWord').then(msg => {
                    setTimeout(() => {
                        msg.delete();
                    }, 5000);
                });
            });
        }

        if (!banTypes.includes(banType)) {
            return await message.delete().then(async () => {
                await message.channel.send('Please provide a valid ban type').then(msg => {
                    setTimeout(() => {
                        msg.delete();
                    }, 5000);
                });
            });
        }

        var reason = args.slice(3).join(' ');
        if (!reason) {
            reason = null
        }

        var bannedUsersData = await bannedUsers.findOne({
            userId: userId
        }).catch((err) => { return client.logger.error(err); });

        if (bannedUsersData) {
            var ban = {
                bantype: banType,
                keyWord: keyWord,
                status: true,
                reason: reason
            }
            bannedUsersData.ban.push(ban);
            await bannedUsersData.save();
        } else {
            bannedUsersData = new bannedUsers({
                userId: userId,
                ban: [{
                    bantype: banType,
                    keyWord: keyWord,
                    status: true,
                    reason: reason
                }]
            });
            await bannedUsersData.save();
        }

        await message.delete().then(async () => {
            await message.channel.send({ content: `**User with id ${userId} has been banned for ${banType} with keyWord ${keyWord}**` }).then(msg => {
                setTimeout(() => {
                    msg.delete();
                }, 5000);
            });
        });

    }
} 