const {
    Events,
} = require('discord.js');
const buttonCooldown = new Set();
require("dotenv").config();
const path = require('path');

const ticketModel = require('../../../events/mongodb/modals/ticket.js');
const ticketData = require("../../../events/mongodb/modals/channel.js");
const ticketLogModel = require('../../../events/mongodb/modals/ticketlog.js');

const { deleteTicketLog } = require('./functions/ticketFunction.js');
const { deleteTicketEmbedandClient, deleteTicketReasonModal, deleteTicketSpam } = require('./functions/ticketEmbed.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        var ticketNumber, IdData, ticketLog;
        const serverAdd = `${process.env.SERVERADD}`;

        if (interaction.customId == "delete-ticket") {

            await interaction.deferReply({ ephemeral: true });

            if (buttonCooldown.has(interaction.user.id)) {
                await deleteTicketSpam(client, interaction);
            } else {
                buttonCooldown.add(interaction.user.id);

                var ticketDoc = await ticketModel.findOne({
                    ticketData: {
                        $elemMatch: {
                            ticketID: interaction.channel.id
                        }
                    }
                }).catch(err => console.log(err));

                if (!ticketDoc) {
                    ticketDoc = await ticketModel.findOne({
                        ticketID: interaction.channel.id
                    }).catch(err => console.log(err));
                    if (!ticketDoc) {
                        return await interaction.editReply({ content: "Internal Error Occured. Delete Ticket Manually || Database missing", ephemeral: true });
                    }
                }

                ticketLog = await ticketLogModel.findOne({
                    guildID: interaction.guild.id,
                    userID: ticketDoc.userID
                }).catch(err => console.log(err));

                if (!ticketLog) {
                    ticketLog = new ticketLogModel({
                        guildID: interaction.guild.id,
                        userID: ticketDoc.userID,
                        count: 0,
                        ticketlog: []
                    });
                    await ticketLog.save();
                }

                IdData = await ticketData.findOne({
                    ticketGuildID: interaction.guild.id
                }).catch(err => console.log(err));

                const guild = client.guilds.cache.get(interaction.guildId);
                const chan = guild.channels.cache.get(interaction.channelId);
                if (chan == null) return;

                await interaction.editReply({
                    content: 'Saving Messages and Deleting the channel ...',
                    ephemeral: true
                });

                //Ticket Logs

                const ticketLogDir = path.join(__dirname, '../website/ticket-logs');
                await deleteTicketLog(client, interaction, ticketLogDir, chan);

                ticketNumber = /^\d+$/.test(interaction.channel.topic) ? parseInt(interaction.channel.topic) : 0;
                const ticketlog = {
                    ticketNumber: ticketNumber,
                    ticketId: interaction.channel.id,
                    transcriptLink: `${serverAdd}/transcript-${interaction.channel.id}.html`
                };

                ticketLog.ticketlog.push(ticketlog);
                ticketLog.count += 1;
                await ticketLog.save();

                await deleteTicketEmbedandClient(client, interaction, IdData, ticketDoc, serverAdd, chan, null);

                setTimeout(async () => {
                    chan.delete()
                        .catch(error => {
                            if (error.code == 10003) {
                                return; //channel not found error
                            }
                        });
                    if (ticketDoc.ticketCount) {
                        ticketDoc.ticketCount -= 1;
                    }
                    ticketDoc.ticketLimit = client.config.TICKET_LIMIT;
                    ticketDoc.ticketData = ticketDoc.ticketData.filter(ticket => ticket.ticketID !== interaction.channel.id);
                    await ticketDoc.save();
                }, 2000);

                setTimeout(() => buttonCooldown.delete(interaction.user.id), 2000);
            }
        }

        if (interaction.customId == "delete-ticket-reason") {
            await deleteTicketReasonModal(client, interaction);
        }

        if (interaction.customId == "ticket-reason-modal") {

            await interaction.deferReply({ ephemeral: true });

            if (buttonCooldown.has(interaction.user.id)) {
                await deleteTicketSpam(client, interaction);
            } else {

                buttonCooldown.add(interaction.user.id);

                const TicketReason = interaction.fields.getTextInputValue('ticket-reason-text');

                var ticketDoc = await ticketModel.findOne({
                    ticketData: {
                        $elemMatch: {
                            ticketID: interaction.channel.id
                        }
                    }
                }).catch(err => console.log(err));

                if (!ticketDoc) {
                    ticketDoc = await ticketModel.findOne({
                        ticketID: interaction.channel.id
                    }).catch(err => console.log(err));
                    if (!ticketDoc) {
                        return await interaction.editReply({ content: "Internal Error Occured. Delete Ticket Manually || Database missing", ephemeral: true });
                    }
                }

                ticketLog = await ticketLogModel.findOne({
                    guildID: interaction.guild.id,
                    userID: ticketDoc.userID
                }).catch(err => console.log(err));

                if (!ticketLog) {
                    ticketLog = new ticketLogModel({
                        guildID: interaction.guild.id,
                        userID: ticketDoc.userID,
                        count: 0,
                        ticketlog: []
                    });
                    await ticketLog.save();
                }

                IdData = await ticketData.findOne({
                    ticketGuildID: interaction.guild.id
                }).catch(err => console.log(err));

                const guild = client.guilds.cache.get(interaction.guildId);
                const chan = guild.channels.cache.get(interaction.channelId);
                if (chan == null) return;

                await interaction.editReply({
                    content: 'Saving Messages and Deleting the channel ...',
                    ephemeral: true
                });

                const ticketLogDir = path.join(__dirname, '../website/ticket-logs');
                await deleteTicketLog(client, interaction, ticketLogDir, chan);

                ticketNumber = /^\d+$/.test(interaction.channel.topic) ? parseInt(interaction.channel.topic) : 0;
                const ticketlog = {
                    ticketNumber: ticketNumber,
                    ticketId: interaction.channel.id,
                    transcriptLink: `${serverAdd}/transcript-${interaction.channel.id}.html`
                };

                ticketLog.ticketlog.push(ticketlog);
                ticketLog.count += 1;
                await ticketLog.save();

                await deleteTicketEmbedandClient(client, interaction, IdData, ticketDoc, serverAdd, chan, TicketReason);

                setTimeout(async () => {
                    chan.delete()
                        .catch(error => {
                            if (error.code == 10003) {
                                return; //channel not found error
                            }
                        });
                    if (ticketDoc.ticketCount) {
                        ticketDoc.ticketCount -= 1;
                    }
                    ticketDoc.ticketLimit = client.config.TICKET_LIMIT;
                    ticketDoc.ticketData = ticketDoc.ticketData.filter(ticket => ticket.ticketID !== interaction.channel.id);
                    await ticketDoc.save();
                }, 2000);
                setTimeout(() => buttonCooldown.delete(interaction.user.id), 2000);
            }
        }
    }
}