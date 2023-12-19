const {
    EmbedBuilder,
    ChannelType
} = require("discord.js");

const musicModal = require("../../events/database/modals/musicGuild.js");
const { musicContent, musicrowdis, musicEmbedOff } = require('../../events/client/music/musicUtls/musicEmbed.js');

module.exports = {
    name: 'musicsetup',
    description: "Owner only command",
    cooldown: 1000,
    owner: true,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    async execute(client, message, args) {

        if (!client.config.music.enabled) return message.reply({ embeds: [new EmbedBuilder().setColor('Red').setDescription("Music is currently disabled")] });

        var musicData = await musicModal.findOne({
            guildID: message.guild.id
        });

        if (!musicData) {
            musicData = new musicModal({
                guildID: message.guild.id,
                musicChannel: null
            });
        }

        var channel = await message.guild.channels.create({
            name: "search music channel",
            type: ChannelType.GuildText,
            topic: `${client.user.tag} | Music Search`,
            parent: message.channel.parent,
        });

        const musicembed = musicEmbedOff(client);
        const musicmsg = await channel.send({ content: musicContent, embeds: [musicembed], components: [musicrowdis] });

        musicData.musicChannel = channel.id;
        musicData.musicPannelId = musicmsg.id;
        await musicData.save();

        await message.delete();

    }
}