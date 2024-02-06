const {
    Events,
    ComponentType,
} = require('discord.js');

const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const ticketGuildModel = require('../../database/modals/ticketGuild.js');
const ticketUserModel = require('../../database/modals/ticketUser.js');

const { reopenTicketChan } = require('./functions/ticketFunction.js');
const { reopenEmbedEdit } = require('./functions/ticketEmbed.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        if (interaction.customId == "reopen-ticket") {
            const channelCreatedTimestamp = interaction.channel.createdTimestamp;
            const thresholdTimestamp = Date.now() - 20 * 60 * 1000;

            if (channelCreatedTimestamp >= thresholdTimestamp) {
                return await interaction.reply({
                    content: "You're unable to reopen a recently created ticket. Please wait for 20 minutes before attempting to do so.",
                    ephemeral: true,
                });
            }

            await interaction.deferReply();

            var ticketUser = await ticketUserModel.findOne({
                'ticketlog.ticketId': interaction.channel.id
            }).catch(err => client.logger.error(err));

            var ticketGuild = await ticketGuildModel.findOne({
                guildID: interaction.guild.id
            }).catch(err => client.logger.error(err));

            if (!ticketUser) return await interaction.editReply({
                content: `Cannot reopen: Ticket not in database!`
            });

            if (!ticketGuild) return await interaction.editReply({
                content: 'Setup is incomplete :('
            });

            const matchingEntry = ticketUser.ticketlog.find(ticket => ticket.ticketId === interaction.channel.id);

            if (matchingEntry) {

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('reopen-ticket-yes')
                            .setLabel('Confirm')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('reopen-ticket-no')
                            .setLabel('Cancel')
                            .setStyle(ButtonStyle.Secondary),
                    );

                const verif = await interaction.editReply({
                    content: 'Are you sure you want to reopen the ticket?',
                    components: [row]
                });

                const collector = verif.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: 15000
                });

                const userButton = interaction.user.id;

                collector.on('collect', async (i) => {

                    await i.deferUpdate();

                    if (i.customId == 'reopen-ticket-yes') {
                        await i.editReply({
                            content: `**Reopening ticket ...** (<@!${userButton}>)`,
                            components: []
                        });
                        matchingEntry.activeStatus = true;
                        await ticketUser.save();

                        setTimeout(async () => {
                            await reopenTicketChan(client, interaction, ticketUser, ticketGuild)
                                .then(async () => {
                                    let message = await interaction.channel.messages.fetch(matchingEntry.ticketPannelId);
                                    if (!message) return;
                                    await reopenEmbedEdit(interaction, message);
                                    collector.stop();
                                });
                        }, 5000);
                    }

                    if (i.customId == 'reopen-ticket-no') {
                        await i.editReply({
                            content: `**Ticket reopen cancelled!** (<@${i.user.id}>)`,
                            components: []
                        });
                        collector.stop();
                    }
                });

                collector.on('end', async (collected) => {
                    if (collected.size <= 0) {
                        await interaction.editReply({
                            content: `**Reopening ticket canceled!** (<@!${userButton}>)`,
                            components: []
                        });
                    }
                });
            }
        }
    }
}