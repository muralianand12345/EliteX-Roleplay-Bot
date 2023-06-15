const {
    Events,
} = require('discord.js');
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const ticketData = require("../../events/models/channel.js");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        if (interaction.customId == "claim-ticket") {

            var IdData = await ticketData.findOne({
                ticketGuildID: interaction.guild.id
            }).catch(err => console.log(err));

            if (!interaction.member.roles.cache.has(IdData.ticketSupportID)) return interaction.reply({ content: 'Tickets can only be claimed by \'Ticket Supporters\'', ephemeral: true });

            const embed = new EmbedBuilder()
                .setColor('Green')
                .setAuthor({ name: 'Claimed Ticket' })
                .setDescription(`Your ticket will be handled by <@${interaction.user.id}>`)
            await interaction.reply({ embeds: [embed] }).then(async (msg) => {

                const content = `**Handled By** <@${interaction.user.id}>`;
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('close-ticket')
                            .setLabel('Close Ticket')
                            .setEmoji('899745362137477181')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('transcript-ticket')
                            .setLabel('Transcript')
                            .setEmoji('📜')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('claim-ticket')
                            .setLabel('Claim')
                            .setEmoji('🔒')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true),
                    );

                await interaction.message.edit({ content: content, components: [row] });
            });


        }
    }
}