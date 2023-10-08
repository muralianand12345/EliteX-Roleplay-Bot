const {
    Events,
    ComponentType,
} = require('discord.js');

const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const ticketModel = require('../../../events/mongodb/modals/ticket.js');
const ticketPar = require('../../../events/mongodb/modals/ticketParent.js');
const ticketData = require("../../../events/mongodb/modals/channel.js");

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
                    content: 'You cannot reopen a newly created ticket! (Wait 20 minutes)',
                    ephemeral: true,
                });
            }
            
            await interaction.deferReply();

            var ticketCheck = await ticketModel.findOne({
                guildID: interaction.guild.id,
                ticketData: {
                    $elemMatch: {
                        ticketID: interaction.channel.id
                    }
                }
            }).catch(err => console.log(err));

            var ticketParents = await ticketPar.findOne({
                guildID: interaction.guild.id
            }).catch(err => console.log(err));

            const IdData = await ticketData.findOne({
                ticketGuildID: interaction.guild.id
            }).catch(err => console.log(err));

            if (!ticketCheck) return await interaction.editReply({
                content: `Cannot reopen: Ticket not in database!`
            });

            if (!ticketParents || !IdData) return await interaction.editReply({
                content: 'Setup is incomplete :('
            });

            const matchingTicketData = ticketCheck.ticketData.find((data) => {
                return data.ticketID === interaction.channel.id;
            });

            if (!matchingTicketData) {
                return await interaction.editReply({
                    content: 'This feature is only available on newer tickets.'
                });
            }

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

                    ticketCheck.ticketStatus = true;
                    await ticketCheck.save();

                    setTimeout(async () => {
                        await reopenTicketChan(client, interaction, ticketCheck, IdData)
                            .then(async () => {
                                let message = await interaction.channel.messages.fetch(matchingTicketData.ticketPannelID);
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