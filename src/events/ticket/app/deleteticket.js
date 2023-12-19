const {
    Events,
} = require('discord.js');
const buttonCooldown = new Set();
require("dotenv").config();
const path = require('path');

const ticketGuildModel = require('../../database/modals/ticketGuild.js');
const ticketUserModel = require('../../database/modals/ticketUser.js');

const { deleteTicketLog } = require('./functions/ticketFunction.js');
const { deleteTicketEmbedandClient, deleteTicketReasonModal, deleteTicketSpam } = require('./functions/ticketEmbed.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        const ticketLogDir = path.join(__dirname, '../../website/ticket-logs');
        const serverAdd = `${process.env.SERVERADD}`;

        if (interaction.customId == "delete-ticket") {

            await interaction.deferReply({ ephemeral: true });

            var ticketUser = await ticketUserModel.findOne({
                'ticketlog.ticketId': interaction.channel.id
            }).catch(err => client.logger.error(err));

            var ticketGuild = await ticketGuildModel.findOne({
                guildID: interaction.guild.id
            }).catch(err => client.logger.error(err));

            if (buttonCooldown.has(interaction.user.id)) {
                await deleteTicketSpam(client, interaction);
            } else {
                buttonCooldown.add(interaction.user.id);

                const guild = client.guilds.cache.get(interaction.guildId);
                const chan = guild.channels.cache.get(interaction.channelId);
                if (chan == null) return;

                await interaction.editReply({
                    content: 'Saving Messages and Deleting the channel ...',
                    ephemeral: true
                });

                //Ticket Logs

                
                await deleteTicketLog(client, interaction, ticketLogDir, chan, null);

                const matchingEntry = ticketUser.ticketlog.find(ticket => ticket.ticketId === interaction.channel.id);

                if (matchingEntry) {
                    matchingEntry.transcriptLink = `${serverAdd}/transcript-${interaction.channel.id}.html`;
                    matchingEntry.activeStatus = false;
                    await ticketUser.save();

                    await deleteTicketEmbedandClient(client, interaction, ticketUser, ticketGuild, serverAdd, chan, null);

                    setTimeout(async () => {
                        chan.delete()
                            .catch(error => {
                                if (error.code == 10003) {
                                    return; //channel not found error
                                }
                            });
                    }, 2000);
                }
                setTimeout(() => buttonCooldown.delete(interaction.user.id), 2000);
            }
        }

        if (interaction.customId == "delete-ticket-reason") {
            await deleteTicketReasonModal(client, interaction);
        }

        if (interaction.customId == "ticket-reason-modal") {

            await interaction.deferReply({ ephemeral: true });

            var ticketUser = await ticketUserModel.findOne({
                'ticketlog.ticketId': interaction.channel.id
            }).catch(err => client.logger.error(err));

            var ticketGuild = await ticketGuildModel.findOne({
                guildID: interaction.guild.id
            }).catch(err => client.logger.error(err));

            if (buttonCooldown.has(interaction.user.id)) {
                await deleteTicketSpam(client, interaction);
            } else {
                buttonCooldown.add(interaction.user.id);

                const TicketReason = interaction.fields.getTextInputValue('ticket-reason-modal-text');

                const guild = client.guilds.cache.get(interaction.guildId);
                const chan = guild.channels.cache.get(interaction.channelId);
                if (chan == null) return;

                await interaction.editReply({
                    content: 'Saving Messages and Deleting the channel ...',
                    ephemeral: true
                });

                await deleteTicketLog(client, interaction, ticketLogDir, chan, null);

                const matchingEntry = ticketUser.ticketlog.find(ticket => ticket.ticketId === interaction.channel.id);

                if (matchingEntry) {
                    matchingEntry.transcriptLink = `${serverAdd}/transcript-${interaction.channel.id}.html`;
                    matchingEntry.activeStatus = false;
                    await ticketUser.save();

                    await deleteTicketEmbedandClient(client, interaction, ticketUser, ticketGuild, serverAdd, chan, TicketReason);

                    setTimeout(async () => {
                        chan.delete()
                            .catch(error => {
                                if (error.code == 10003) {
                                    return; //channel not found error
                                }
                            });
                    }, 2000);
                }
                setTimeout(() => buttonCooldown.delete(interaction.user.id), 2000);
            }
        }
    }
};