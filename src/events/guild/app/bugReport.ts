import { Events, EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, WebhookClient } from 'discord.js';

import { BotEvent } from "../../../types";

const event: BotEvent = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        if (!interaction.isButton() && !interaction.isModalSubmit()) return;
        if (interaction.customId == "bug-report") {
            if (interaction.user.bot) return;
            if (client.config.bugreport.enable == false) return interaction.reply({ content: 'Bug Report is currently disabled!', ephemeral: true });

            const bugReportModal = new ModalBuilder()
                .setCustomId('bug-report-modal')
                .setTitle(`${interaction.user.username} Bug Report`);

            const bugReportTextInput = new TextInputBuilder()
                .setCustomId('bug-report-text')
                .setLabel('Bug Report')
                .setPlaceholder('Please describe the bug you found')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMinLength(10);

            const bugReportRow = new ActionRowBuilder<TextInputBuilder>().addComponents(bugReportTextInput);
            bugReportModal.addComponents(bugReportRow);

            await interaction.showModal(bugReportModal);
        }

        if (interaction.customId == "bug-report-modal") {
            await interaction.deferReply({ ephemeral: true });

            const webhook = new WebhookClient({ url: client.config.bugreport.webhook });

            const answer = interaction.fields.getTextInputValue('bug-report-text') || 'No description provided';
            const user = interaction.user;

            const embed = new EmbedBuilder()
                .setColor('Red')
                .setAuthor({ name: `${user.username}#${user.discriminator}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
                .setDescription(`\`\`\`${answer}\`\`\``)
                .setFooter({ text: `ID: ${user.id}` })
                .setTimestamp();

            await webhook.send({
                username: `${client.user.username}`,
                avatarURL: `${client.user.displayAvatarURL()}`,
                embeds: [embed]
            });

            return await interaction.editReply({ content: 'Bug Report Submitted!', ephemeral: true });
        }
    }
};

export default event;