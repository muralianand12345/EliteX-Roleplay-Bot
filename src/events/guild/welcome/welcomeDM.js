const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Events
} = require("discord.js");

const welcomeUserModal = require('../../database/modals/welcomeUser.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {

        if (!member.guild) return;
        if (!client.config.welcome.welcomedm.enabled) return;

        var welcomeUserData = await welcomeUserModal.findOne({
            guildId: member.guild.id
        });

        if (!welcomeUserData) return;

        var embedDescription = welcomeUserData.welcomeMsg.description
            .replace(/<usermention>/g, `<@${member.user.id}>`)
            .replace(/<username>/g, `${member.user.username}`)
            .replace(/<guildname>/g, `${member.guild.name}`)
            .replace(/<guildsize>/g, `${member.guild.memberCount}`);

        var embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setThumbnail(`${client.user.avatarURL()}`)
            .setTitle(`Welcome to ${member.guild.name}`)
            .setDescription(`${embedDescription}`);

        await welcomeUserData.welcomeMsg.fields.forEach(field => {
            embed.addFields({ name: `${field.name}`, value: `${field.value}` });
        });

        if (welcomeUserData.welcomeMsg.forLinks) {
            var button = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel(`Apply Here`)
                        .setEmoji('📲')
                        .setStyle(ButtonStyle.Link)
                        .setURL(welcomeUserData.welcomeMsg.forLinks)
                );

            await member.user.send({ embeds: [embed], components: [button] }).catch(error => {
                if (error.code == 50007) return;
            });
        } else {
            await member.user.send({ embeds: [embed] }).catch(error => {
                if (error.code == 50007) return;
            });
        }
    }
}