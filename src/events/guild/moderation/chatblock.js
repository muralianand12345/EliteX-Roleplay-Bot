const { Events, EmbedBuilder } = require("discord.js");
const blockUserModel = require("../../../events/mongodb/modals/blockusers.js");

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {

        if (message.channel.id == client.blockchat.CHAN.PICSCAFE) {
            var blockUserData = await blockUserModel.findOne({
                guildId: message.guild.id,
                userId: message.author.id,
                event: 'piccafe',
                block: true,
            }).catch(err => console.log(err));

            if (blockUserData) {
                const expirationDate = blockUserData.expirationDate;
                const currentDate = new Date();
                const timeDifferenceMs = expirationDate - currentDate;
                const daysLeft = Math.floor(timeDifferenceMs / (1000 * 60 * 60 * 24));
                const hoursLeft = Math.floor((timeDifferenceMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                return await message.delete().then(async () => {

                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('***Message Deleted | User on Cooldown***')
                        .addFields(
                            { name: 'User', value: `<@${message.author.id}>` },
                            { name: 'Channel', value: `<#${message.channel.id}>` }
                        );

                    await client.channels.cache.get(client.blockchat.LOG).send({ embeds: [embed] });
                    var deletionMessage = await client.users.cache.get(message.author.id).send({
                        content: `<@${message.author.id}>, **Your message has been deleted at** <#${message.channel.id}>**, cooldown activated. ${daysLeft} days and ${hoursLeft} hours left. (Automod - Blacklisted).**`
                    });
                    setTimeout(function () {
                        deletionMessage.delete();
                    }, 60000);
                });
            }
        }

        if (message.channel.id == client.blockchat.CHAN.MEME) {
            var blockUserData = await blockUserModel.findOne({
                guildId: message.guild.id,
                userId: message.author.id,
                event: 'meme',
                block: true,
            }).catch(err => console.log(err));

            if (blockUserData) {
                const expirationDate = blockUserData.expirationDate;
                const currentDate = new Date();
                const timeDifferenceMs = expirationDate - currentDate;
                const daysLeft = Math.floor(timeDifferenceMs / (1000 * 60 * 60 * 24));
                const hoursLeft = Math.floor((timeDifferenceMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                return await message.delete().then(async () => {

                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('***Message Deleted | User on Cooldown***')
                        .addFields(
                            { name: 'User', value: `<@${message.author.id}>` },
                            { name: 'Channel', value: `<#${message.channel.id}>` }
                        );

                    await client.channels.cache.get(client.blockchat.LOG).send({ embeds: [embed] });
                    var deletionMessage = await client.users.cache.get(message.author.id).send({
                        content: `<@${message.author.id}>, **Your message has been deleted at** <#${message.channel.id}>**, cooldown activated. ${daysLeft} days and ${hoursLeft} hours left. (Automod - Blacklisted).**`
                    });
                    setTimeout(function () {
                        deletionMessage.delete();
                    }, 60000);
                });
            }
        }

        if (message.channel.id == client.blockchat.CHAN.OOCCHAT) {
            var blockUserData = await blockUserModel.findOne({
                guildId: message.guild.id,
                userId: message.author.id,
                event: 'oocchat',
                block: true,
            }).catch(err => console.log(err));

            if (blockUserData) {
                const expirationDate = blockUserData.expirationDate;
                const currentDate = new Date();
                const timeDifferenceMs = expirationDate - currentDate;
                const daysLeft = Math.floor(timeDifferenceMs / (1000 * 60 * 60 * 24));
                const hoursLeft = Math.floor((timeDifferenceMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                return await message.delete().then(async () => {

                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('***Message Deleted | User on Cooldown***')
                        .addFields(
                            { name: 'User', value: `<@${message.author.id}>` },
                            { name: 'Channel', value: `<#${message.channel.id}>` }
                        );

                    await client.channels.cache.get(client.blockchat.LOG).send({ embeds: [embed] });
                    var deletionMessage = await client.users.cache.get(message.author.id).send({
                        content: `<@${message.author.id}>, **Your message has been deleted at** <#${message.channel.id}>**, cooldown activated. ${daysLeft} days and ${hoursLeft} hours left. (Automod - Blacklisted).**`
                    });
                    setTimeout(function () {
                        deletionMessage.delete();
                    }, 60000);
                });
            }
        }

        if (message.channel.id == client.blockchat.CHAN.ICCHAT) {
            var blockUserData = await blockUserModel.findOne({
                guildId: message.guild.id,
                userId: message.author.id,
                event: 'icchat',
                block: true,
            }).catch(err => console.log(err));

            if (blockUserData) {
                const expirationDate = blockUserData.expirationDate;
                const currentDate = new Date();
                const timeDifferenceMs = expirationDate - currentDate;
                const daysLeft = Math.floor(timeDifferenceMs / (1000 * 60 * 60 * 24));
                const hoursLeft = Math.floor((timeDifferenceMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                return await message.delete().then(async () => {

                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('***Message Deleted | User on Cooldown***')
                        .addFields(
                            { name: 'User', value: `<@${message.author.id}>` },
                            { name: 'Channel', value: `<#${message.channel.id}>` }
                        );

                    await client.channels.cache.get(client.blockchat.LOG).send({ embeds: [embed] });
                    var deletionMessage = await client.users.cache.get(message.author.id).send({
                        content: `<@${message.author.id}>, **Your message has been deleted at** <#${message.channel.id}>**, cooldown activated. ${daysLeft} days and ${hoursLeft} hours left. (Automod - Blacklisted).**`
                    });
                    setTimeout(function () {
                        deletionMessage.delete();
                    }, 60000);
                });
            }
        }

        if (message.channel.id == client.blockchat.CHAN.OPENCHAT) {
            var blockUserData = await blockUserModel.findOne({
                guildId: message.guild.id,
                userId: message.author.id,
                event: 'openchat',
                block: true,
            }).catch(err => console.log(err));

            if (blockUserData) {
                const expirationDate = blockUserData.expirationDate;
                const currentDate = new Date();
                const timeDifferenceMs = expirationDate - currentDate;
                const daysLeft = Math.floor(timeDifferenceMs / (1000 * 60 * 60 * 24));
                const hoursLeft = Math.floor((timeDifferenceMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                return await message.delete().then(async () => {

                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('***Message Deleted | User on Cooldown***')
                        .addFields(
                            { name: 'User', value: `<@${message.author.id}>` },
                            { name: 'Channel', value: `<#${message.channel.id}>` }
                        );

                    await client.channels.cache.get(client.blockchat.LOG).send({ embeds: [embed] });
                    var deletionMessage = await client.users.cache.get(message.author.id).send({
                        content: `<@${message.author.id}>, **Your message has been deleted at** <#${message.channel.id}>**, cooldown activated. ${daysLeft} days and ${hoursLeft} hours left. (Automod - Blacklisted).**`
                    });
                    setTimeout(function () {
                        deletionMessage.delete();
                    }, 60000);
                });
            }
        }
    }
}