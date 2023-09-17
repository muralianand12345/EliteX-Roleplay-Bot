const { Events } = require("discord.js");
const {
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        if (!interaction.isButton()) return;

        if (interaction.customId == "banonleave-ban") {
            if (interaction.guild.id !== client.mod.BANONLEAVE.GUILD) return interaction.reply({ content: "This is not the right server", ephemeral: true });
            if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) return interaction.reply({ content: "You don't have permission to ban", ephemeral: true });

            await interaction.deferReply({ ephemeral: true });

            const originalEmbed = interaction.message.embeds[0];
            const userId = originalEmbed.footer.text;
            const embedDescription = originalEmbed.description;

            const banReason = `Visa Holder Left The Server | By: ${interaction.user.tag}`;

            const userMember = interaction.guild.members.cache.get(userId);

            var embed = new EmbedBuilder()
                .setColor('Red')
                .setAuthor({ name: "Permanent Ban", iconURL: `${client.user.displayAvatarURL()}` })
                .addFields({ name: "Banned By", value: `<@${interaction.user.id}>` })
                .setDescription(`${embedDescription}`)
                .setFooter({ text: `${userId}` })
                .setTimestamp();

            if (!userMember) {
                try {
                    await interaction.guild.members.ban(userId, { reason: banReason });
                    await interaction.message.edit({ embeds: [embed], components: [] });
                    await interaction.editReply({ content: `User banned: <@${userId}>`, ephemeral: true });
                } catch (error) {
                    console.error(error);
                    await interaction.editReply({ content: 'An error occurred while banning the user.', ephemeral: true });
                }
            } else {
                try {
                    await userMember.ban({ reason: banReason });
                    await interaction.message.edit({ embeds: [embed], components: [] });
                    await interaction.editReply({ content: `User banned: ${userMember.user.tag}`, ephemeral: true });
                } catch (error) {
                    console.error(error);
                    await interaction.editReply({ content: 'An error occurred while banning the user.', ephemeral: true });
                }
            }
        }
    }
}
