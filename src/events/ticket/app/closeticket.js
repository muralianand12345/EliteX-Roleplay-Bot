const {
    ComponentType,
    Events,
} = require('discord.js');
const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const ticketGuildModel = require('../../database/modals/ticketGuild.js');
const ticketUserModel = require('../../database/modals/ticketUser.js');

const { closeTicketChan } = require('./functions/ticketFunction.js');
const { closeTicketEmbed, closeTicketEditInt } = require('./functions/ticketEmbed.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        if (!interaction.isButton()) return;

        try {
            if (interaction.customId == "close-ticket") {

                await interaction.deferReply();

                var ticketData = await ticketGuildModel.findOne({
                    guildID: interaction.guild.id
                }).catch(err => client.logger.error(err));

                const ticketUser = await ticketUserModel.findOne({
                    'ticketlog.ticketId': interaction.channel.id
                }).catch(err => client.logger.error(err));

                if (!ticketData) {
                    return await interaction.editReply({ content: 'Ticket system is not active!', ephemeral: true });
                } else {
                    var closeTicket = ticketData.closedPar;
                }

                const userButton = interaction.user.id;

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('confirm-close-ticket')
                            .setLabel('Close ticket')
                            .setStyle(ButtonStyle.Danger),

                        new ButtonBuilder()
                            .setCustomId('no-close-ticket')
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
                    if (i.customId == 'confirm-close-ticket') {
                        try {
                            await closeTicketEditInt(client, interaction);
                            await i.editReply({
                                content: `Ticket closed by <@!${i.user.id}>`,
                                components: []
                            });
                            await closeTicketEmbed(client, interaction).then(async () => {
                                await closeTicketChan(client, interaction, closeTicket, ticketData.ticketSupportID, ticketUser.userID);
                                collector.stop();
                            });
                        } catch (error) {
                            if (error.code == 10062) {
                                const followUpContent = 'An error occurred while closing the ticket. Please try again.';
                                client.logger.error(`Error 86 | ${followUpContent}`);
                                await interaction.followUp({ content: followUpContent });
                            } else {
                                client.logger.error(`An error occurred while editing the reply: ${error}`);
                            }
                        }
                    }

                    if (i.customId == 'no-close-ticket') {
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
                            content: `**Ticket closure cancelled!** (<@!${userButton}>)`,
                            components: []
                        }).catch(async (err) => {
                            if (err.code == 10008) {
                                await interaction.channel.send({ content: '**ERROR: Interaction Not Found!**' }).then((msg) => {
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
                client.logger.error('Unknown interaction error occurred:', error);
            } else {
                client.logger.error('An error occurred:', error);
            }
        }
    }
};