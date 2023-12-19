const {
    SlashCommandBuilder,
    EmbedBuilder,
} = require('discord.js');

const musicModel = require("../../events/database/modals/musicGuild.js");
const { musicContent, musicrowdis, musicEmbedOff } = require("../../events/client/music/musicUtls/musicEmbed.js");

module.exports = {
    cooldown: 5000,
    owner: false,
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription("Stop Music")
        .setDMPermission(false),
    async execute(interaction, client) {

        if (!client.config.music.enabled) return interaction.reply({ embeds: [new EmbedBuilder().setColor('Red').setDescription("Music is currently disabled")], ephemeral: true });

        const player = client.manager.get(interaction.guild.id);

        if (!player || !player?.queue?.current) {
            return interaction.reply({
                embeds: [new EmbedBuilder().setColor('Red').setDescription("There is no music playing")],
                ephemeral: true,
            });
        }

        if (!interaction.member.voice.channel) {
            return interaction.reply({
                embeds: [new EmbedBuilder().setColor('Red').setDescription("Please connect to a voice channel first")],
                ephemeral: true,
            });
        }

        if (interaction.member.voice.channel?.id !== player.voiceChannel) {
            return interaction.reply({
                embeds: [new EmbedBuilder().setColor('Red').setDescription("It seems like you are not in the same voice channel as me")],
                ephemeral: true,
            });
        }

        var musicData = await musicModel.findOne({
            guildID: interaction.guild.id
        });

        if (musicData) {
            const pannelId = musicData.musicPannelId;
            if (pannelId) {
                const pannelChan = client.channels.cache.get(musicData.musicChannel);
                const pannelMsg = await pannelChan.messages.fetch(pannelId);
                if (!pannelMsg) return pannelMsg.send(`Music Pannel not found, setup again! | ${pannelId} `);
                const embed = musicEmbedOff(client);
                pannelMsg.edit({ content: musicContent, embeds: [embed], components: [musicrowdis] });
            }
        }

        player.destroy();
        await interaction.reply({
            embeds: [new EmbedBuilder().setColor(client.config.music.embedcolor).setDescription("I stopped the music!")],
        });
    }
}