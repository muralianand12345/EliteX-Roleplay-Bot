const {
    ComponentType,
    Events,
} = require('discord.js');
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const ticketModel = require('../../../events/mongodb/modals/ticket.js');
const ticketData = require("../../../events/mongodb/modals/channel.js");
const ticketPar = require('../../../events/mongodb/modals/ticketParent.js');

const { closeTicketChan } = require('./functions/ticketFunction.js');
const { closeTicketEmbed, closeTicketEditInt } = require('./functions/ticketEmbed.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        if (!interaction.isButton()) return;

        try {
            if (interaction.customId == "close-ticket") {

                await interaction.deferReply();

                const IdData = await ticketData.findOne({
                    ticketGuildID: interaction.guild.id
                }).catch(err => console.log(err));

                if (!IdData) {
                    return;
                }

                var ticketDoc = await ticketModel.findOne({
                    ticketData: {
                        $elemMatch: {
                            ticketID: interaction.channel.id
                        }
                    }
                }).catch(err => console.log(err));

                //For OLD Ticket
                if (!ticketDoc) {
                    ticketDoc = await ticketModel.findOne({
                        ticketID: interaction.channel.id
                    }).catch(err => console.log(err));
                }

                var ticketParents = await ticketPar.findOne({
                    guildID: interaction.guild.id
                }).catch(err => console.log(err));

                if (!ticketParents) {
                    return;
                } else if (ticketParents) {
                    var closeTicket = ticketParents.closedPar;
                }

                const userButton = interaction.user.id;

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('confirm-close')
                            .setLabel('Close ticket')
                            .setStyle(ButtonStyle.Danger),

                        new ButtonBuilder()
                            .setCustomId('no')
                            .setLabel('Cancel closure')
                            .setStyle(ButtonStyle.Secondary),
                    );

                const verif = await interaction.editReply({
                    content: 'Are you sure you want to close the ticket?',
                    components: [row]
                });

                const collector = verif.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: 15000
                });

                collector.on('collect', async (i) => {
                    await i.deferUpdate();
                    if (i.customId == 'confirm-close') {
                        try {
                            await closeTicketEditInt(client, interaction);
                            await i.editReply({
                                content: `Ticket closed by <@!${i.user.id}>`,
                                components: []
                            });

                            await closeTicketEmbed(client, interaction).then(async () => {
                                await closeTicketChan(client, interaction, closeTicket, IdData.ticketSupportID, ticketDoc.userID);
                                collector.stop();
                            });

                        } catch (error) {
                            if (error.code == 10062) {
                                const followUpContent = 'An error occurred while closing the ticket. Please try again.';
                                console.log(`Error 86 | ${followUpContent}`);
                                await interaction.followUp({ content: followUpContent });
                            } else {
                                console.error(`An error occurred while editing the reply: ${error}`);
                            }
                        }
                    }

                    if (i.customId == 'no') {

                        await i.editReply({
                            content: `**Ticket closure cancelled!** (<@${i.user.id}>)`,
                            components: []
                        });
                        collector.stop();
                    }
                });

                collector.on('end', async (collected) => {
                    if (collected.size <= 0) {
                        await interaction.editReply({
                            content: `**Closing of the canceled ticket!** (<@!${userButton}>)`,
                            components: []
                        }).catch(async (err) => {
                            if (err.code == 10008) {
                                await interaction.channel.send({ content: '**Ticket Cancellation Message Has Been Deleted!**' }).then((msg) => {
                                    setTimeout(function () {
                                        msg.delete();
                                    }, 4000);
                                });
                            }
                        });
                    }
                });
            }

        } catch (error) {
            if (error.code === 10062) {
                console.log('Unknown interaction error occurred:', error);
            } else {
                console.error('An error occurred:', error);
            }
        }
    }
};