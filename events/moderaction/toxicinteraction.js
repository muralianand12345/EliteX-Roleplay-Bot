const { Events, InteractionType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.type === InteractionType.MessageComponent || !interaction.type === InteractionType.ModalSubmit) return;

        if (interaction.customId == "toxicchat-timeout") {
            const TimeoutModal = new ModalBuilder()
                .setCustomId('toxicchat-timeout-modal')
                .setTitle('Timeout User');

            const Reason = new TextInputBuilder()
                .setCustomId('toxicchat-timeout-reason')
                .setLabel('Reason to timeout')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false);
            const Time = new TextInputBuilder()
                .setCustomId('toxicchat-timeout-time')
                .setLabel('Timeout Duration')
                .setPlaceholder('Note: In minutes Eg -> 1, 5, 60')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const firstActionRow = new ActionRowBuilder().addComponents(Reason);
            const secondActionRow = new ActionRowBuilder().addComponents(Time);
            TimeoutModal.addComponents(firstActionRow, secondActionRow);
            await interaction.showModal(TimeoutModal);
        }

        if (interaction.customId == "toxicchat-kick") {
            const KickModal = new ModalBuilder()
                .setCustomId('toxicchat-kick-modal')
                .setTitle('Kick User');

            const Reason = new TextInputBuilder()
                .setCustomId('toxicchat-kick-reason')
                .setLabel('Reason to Kick')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const firstActionRow = new ActionRowBuilder().addComponents(Reason);
            KickModal.addComponents(firstActionRow);
            await interaction.showModal(KickModal);
        }

        if (interaction.customId == "toxicchat-ban") {
            const BanModal = new ModalBuilder()
                .setCustomId('toxicchat-ban-modal')
                .setTitle('Ban User');

            const Reason = new TextInputBuilder()
                .setCustomId('toxicchat-ban-reason')
                .setLabel('Reason to Ban')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const firstActionRow = new ActionRowBuilder().addComponents(Reason);
            BanModal.addComponents(firstActionRow);
            await interaction.showModal(BanModal);
        }

        //modal submit

        if (interaction.customId == "toxicchat-timeout-modal") {
            const Reason = interaction.fields.getTextInputValue('toxicchat-timeout-reason') || `No Reason Provided`;
            const Time = interaction.fields.getTextInputValue('toxicchat-timeout-time');
            if (!+Time) return interaction.reply({ content: 'Invalid Time!', ephemeral: true });

            const originalEmbed = interaction.message.embeds[0];
            const userId = originalEmbed.footer.text;
            const userMember = interaction.guild.members.cache.get(userId);
            if (!userMember) return interaction.reply({ content: 'Unable to find the user!', ephemeral: true });
            await userMember.timeout(+Time * 60000, `${Reason} | ${interaction.user.username}`)
                .then(async () => {
                    interaction.reply({ content: 'Success', ephemeral: true });
                    await interaction.message.delete();
                })
                .catch(err => {
                    if (err.code == 50013) return interaction.reply({ content: 'No permission to timeout the user!', ephemeral: true });
                    console.error(err);
                });
        }
    }
}