const {
    ChannelType
} = require("discord.js");

const statsModel = require('../../events/mongodb/modals/serverStats.js');

module.exports = {
    name: 'serverstats',
    description: "Gives server member count in voice channel",
    cooldown: 1000,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    run: async (client, message, args) => {

        const commandName = `MESS_SERVERSTATS`;
        client.std_log.error(client, commandName, message.author.id, message.channel.id);

        var statsDoc = await statsModel.findOne({
            guildID: message.guild.id
        }).catch(err => console.log(err));

        if (statsDoc) {
            await message.reply({ content: 'Server stats has already been setup! Do you want to update and reconfigure? (Yes/No)' })
                .then(async (sentMessage) => {

                    var vcChan = message.mentions.channels.first();
                    if (!vcChan) {
                        chanId = args[0];
                        vcChan = client.channels.cache.get(chanId);
                    }
                    if (!vcChan) return sentMessage.edit({ content: "Invalid Voice Channel" });
                    if (vcChan.type !== ChannelType.GuildVoice) return sentMessage.edit({ content: "Select Only Voice Channel" });

                    const filter = m => m.author.id === message.author.id;
                    const collector = message.channel.createMessageCollector({ filter, max: 1, time: 60000 });

                    collector.on('collect', async (collected) => {

                        var responseUser;
                        const response = collected.content.toLowerCase();
                        if (response === 'yes') {
                            responseUser = true;
                        } else if (response === 'no') {
                            responseUser = false;
                        } else {
                            responseUser = null;
                        }

                        if (responseUser == true) {

                            statsDoc.chanID = vcChan.id;
                            await statsDoc.save();

                            sentMessage.edit({ content: 'Sucessfully configured!' });
                        } else if (responseUser == false) {
                            sentMessage.edit({ content: 'Canceling process ...' });
                        }
                    });

                    collector.on('end', collected => {
                        if (collected.size === 0) {
                            sentMessage.edit({ content: "No Reply! Canceling process ..." });
                        }
                    });
                });

        } else {
            await message.reply({ content: 'Setting UP!' }).then(async (sentMessage) => {
                var vcChan = message.mentions.channels.first();
                if (!vcChan) {
                    chanId = args[0];
                    vcChan = client.channels.cache.get(chanId);
                }
                if (!vcChan) return sentMessage.edit({ content: "Invalid Voice Channel" });
                if (vcChan.type !== ChannelType.GuildVoice) return sentMessage.edit({ content: "Select Only Voice Channel" });

                statsDoc = new statsModel({
                    guildID: message.guild.id,
                    guildName: message.guild.name,
                    chanID: vcChan.id,
                    totalMemberCount: 0
                });
                await statsDoc.save();
                sentMessage.edit({ content: 'Sucessfully configured!' });
            });
        }
    }
}