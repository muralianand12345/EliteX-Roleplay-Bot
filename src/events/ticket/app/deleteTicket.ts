import { ButtonInteraction, Events, TextChannel } from "discord.js";
import { config } from "dotenv";
import path from "path";

import { BotEvent, ITicketLog } from '../../../types';
import ticketGuildModel from "../../database/schema/ticketGuild";
import ticketUserModel from "../../database/schema/ticketUser";
import { deleteTicketLog } from "../../../utils/ticket/ticketFunction";
import { deleteTicketEmbedandClient, deleteTicketReasonModal, deleteTicketSpam } from "../../../utils/ticket/ticketEmbed";

const buttonCooldown = new Set();
config();

const event: BotEvent = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        const ticketLogDir = path.join(__dirname, '../../../../ticket-logs');
        const serverAdd = `${process.env.SERVERADD}`;

        const getTicketUser = async () => {
            try {
                const ticketUser = await ticketUserModel.findOne({
                    'ticketlog.ticketId': interaction.channel.id
                });

                if (!ticketUser) {
                    throw new Error('Ticket user not found');
                }

                if (!ticketUser.userId) {
                    throw new Error('userId is required');
                }

                return ticketUser;
            } catch (err) {
                client.logger.error('Error fetching ticket user:', err);
                throw err;
            }
        };

        const getTicketGuild = async () => {
            try {
                const ticketGuild = await ticketGuildModel.findOne({
                    guildId: interaction.guild.id
                });

                if (!ticketGuild) {
                    throw new Error('Ticket guild not found');
                }

                return ticketGuild;
            } catch (err) {
                client.logger.error('Error fetching ticket guild:', err);
                throw err;
            }
        };

        const handleTicketError = async (interaction: ButtonInteraction, chan: TextChannel) => {
            try {
                await interaction.editReply({
                    content: 'An error occurred. Deleting the channel ...'
                });

                setTimeout(async () => {
                    chan.delete()
                        .catch((error) => {
                            if (error.code === 10003) {
                                return; // Channel not found error
                            }
                        });
                }, 2000);
            } catch (err) {
                client.logger.error('Error handling ticket error:', err);
            }
        };

        if (interaction.customId === "delete-ticket") {
            await interaction.deferReply({ ephemeral: true });

            try {
                const ticketUser = await getTicketUser();
                const ticketGuild = await getTicketGuild();

                if (buttonCooldown.has(interaction.user.id)) {
                    await deleteTicketSpam(client, interaction);
                } else {
                    buttonCooldown.add(interaction.user.id);
                    setTimeout(() => buttonCooldown.delete(interaction.user.id), 2000);

                    const guild = client.guilds.cache.get(interaction.guildId);
                    const chan = guild.channels.cache.get(interaction.channelId);
                    if (chan == null) return;

                    await interaction.editReply({
                        content: 'Saving Messages and Deleting the channel ...',
                        ephemeral: true
                    });

                    await deleteTicketLog(client, interaction, ticketLogDir, chan, "no-image-save");

                    const matchingEntry = ticketUser.ticketlog.find((ticket: ITicketLog) => ticket.ticketId === interaction.channel.id);

                    if (matchingEntry) {
                        matchingEntry.transcriptLink = `${serverAdd}/transcript-${interaction.channel.id}.html`;
                        matchingEntry.activeStatus = false;
                        await ticketUser.save();

                        await deleteTicketEmbedandClient(client, interaction, ticketUser, ticketGuild, serverAdd, chan, null);

                        setTimeout(async () => {
                            chan.delete()
                                .catch((error: Error | any) => {
                                    if (error.code === 10003) {
                                        return; // Channel not found error
                                    }
                                });
                        }, 2000);
                    }
                }
            } catch (err) {
                const guild = client.guilds.cache.get(interaction.guildId);
                const chan = guild.channels.cache.get(interaction.channelId);
                if (chan == null) return;
                await handleTicketError(interaction, chan);
            }
        }

        if (interaction.customId === "delete-ticket-reason") {
            await deleteTicketReasonModal(client, interaction);
        }

        if (interaction.customId === "ticket-reason-modal") {
            await interaction.deferReply({ ephemeral: true });

            try {
                const ticketUser = await getTicketUser();
                const ticketGuild = await getTicketGuild();

                if (buttonCooldown.has(interaction.user.id)) {
                    await deleteTicketSpam(client, interaction);
                } else {
                    buttonCooldown.add(interaction.user.id);
                    setTimeout(() => buttonCooldown.delete(interaction.user.id), 2000);

                    const TicketReason = interaction.fields.getTextInputValue('ticket-reason-modal-text');

                    const guild = client.guilds.cache.get(interaction.guildId);
                    const chan = guild.channels.cache.get(interaction.channelId);
                    if (chan == null) return;

                    await interaction.editReply({
                        content: 'Saving Messages and Deleting the channel ...',
                        ephemeral: true
                    });

                    await deleteTicketLog(client, interaction, ticketLogDir, chan, "no-image-save");

                    const matchingEntry = ticketUser.ticketlog.find((ticket: ITicketLog) => ticket.ticketId === interaction.channel.id);

                    if (matchingEntry) {
                        matchingEntry.transcriptLink = `${serverAdd}/transcript-${interaction.channel.id}.html`;
                        matchingEntry.activeStatus = false;
                        await ticketUser.save();

                        await deleteTicketEmbedandClient(client, interaction, ticketUser, ticketGuild, serverAdd, chan, TicketReason);

                        setTimeout(async () => {
                            chan.delete()
                                .catch((error: Error | any) => {
                                    if (error.code === 10003) {
                                        return; // Channel not found error
                                    }
                                });
                        }, 2000);
                    }
                }
            } catch (err) {
                const guild = client.guilds.cache.get(interaction.guildId);
                const chan = guild.channels.cache.get(interaction.channelId);
                if (chan == null) return;
                await handleTicketError(interaction, chan);
            }
        }
    }
};

export default event;
