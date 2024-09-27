import { ComponentType, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, Snowflake, Message } from "discord.js";

import ticketGuildModel from "../../database/schema/ticketGuild";
import ticketUserModel from "../../database/schema/ticketUser";
import { closeTicketChan } from "../../../utils/ticket/ticketFunction";
import { closeTicketEmbed, closeTicketEditInt } from "../../../utils/ticket/ticketEmbed";
import { BotEvent } from '../../../types';

const event: BotEvent = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.isButton()) return;

        try {

            if (interaction.customId == "close-ticket") {

                await interaction.deferReply();

                const ticketData = await ticketGuildModel.findOne({
                    guildId: interaction.guild.id
                }).catch(err => client.logger.error(err));

                const ticketUser = await ticketUserModel.findOne({
                    'ticketlog.ticketId': interaction.channel.id
                }).catch(err => client.logger.error(err));

                if (!ticketData) {
                    return await interaction.editReply({ content: 'Ticket system is not active!', ephemeral: true });
                } else {
                    var closeTicket = ticketData.closedParent;
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

                collector.on('collect', async (i: any) => {
                    await i.deferUpdate();
                    if (i.customId == 'confirm-close-ticket') {
                        try {
                            await closeTicketEditInt(client, interaction);
                            await i.editReply({
                                content: `Ticket closed by <@!${i.user.id}>`,
                                components: []
                            });
                            await closeTicketEmbed(client, interaction).then(async () => {
                                await closeTicketChan(client, interaction, closeTicket, ticketData.ticketSupportId, ticketUser.userId);
                                collector.stop();
                            });
                        } catch (error: Error | any) {
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

                collector.on('end', async (collected: Collection<Snowflake, Message>) => {
                    if (collected.size <= 0) {
                        try {
                            await interaction.editReply({
                                content: `**Ticket closure cancelled!** (<@!${userButton}>)`,
                                components: []
                            });
                        } catch (err: any) {
                            if (err.code === 10008) {
                                client.logger.warn('Ticket interaction is no longer valid. Unable to edit reply.');
                            } else if (err.code === 10062) {
                                client.logger.warn('Ticket interaction has already been acknowledged. Unable to edit reply.');
                            } else {
                                client.logger.error('Error while editing reply:', err);
                            }

                            if (interaction.channel) {
                                try {
                                    const msg = await interaction.channel.send({ content: '**Ticket closure cancelled!**' });
                                    setTimeout(() => {
                                        msg.delete().catch((deleteErr: Error) => client.logger.warn('Failed to delete message:', deleteErr));
                                    }, 4000);
                                } catch (channelErr) {
                                    client.logger.error('Failed to send message to channel:', channelErr);
                                }
                            } else {
                                client.logger.warn('Ticket channel not available. Unable to send fallback message.');
                            }
                        }
                    }
                });
            }

        } catch (error: Error | any) {
            if (error.code === 10062) {
                client.logger.error('Unknown interaction error occurred:', error);
            } else {
                client.logger.error('An error occurred:', error);
            }
        }
    }
}

export default event;