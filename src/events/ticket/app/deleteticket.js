const {
    Events,
} = require('discord.js');
const {
    EmbedBuilder,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");
const buttonCooldown = new Set();
const discordTranscripts = require('discord-html-transcripts');
require("dotenv").config();
const fs = require('fs');
const path = require('path');

const ticketModel = require('../../../events/mongodb/modals/ticket.js');
const ticketData = require("../../../events/mongodb/modals/channel.js");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        if (interaction.customId == "delete-ticket") {

            await interaction.deferReply({ ephemeral: true });

            if (buttonCooldown.has(interaction.user.id)) {
                const replyEmbed = new EmbedBuilder()
                    .setColor('#ED4245')
                    .setDescription("Interaction not registered! (Button Spam Dedected!)")
                await interaction.editReply({ embeds: [replyEmbed], ephemeral: true });
            } else {
                buttonCooldown.add(interaction.user.id);

                const ticketDoc = await ticketModel.findOne({
                    ticketID: interaction.channel.id
                }).catch(err => console.log(err));

                if (!ticketDoc) {
                    return await interaction.editReply({ content: "Internal Error Occured. Delete Ticket Manually || Database missing", ephemeral: true });
                }

                var IdData = await ticketData.findOne({
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
                const htmlCode = await discordTranscripts.createTranscript(chan, {
                    limit: -1,
                    returnType: 'string',
                    filename: `transcript-${interaction.channel.id}.html`,
                    saveImages: false,
                    poweredBy: false
                });

                const serverAdd = `${process.env.SERVERADD}`;
                const ticketLogDir = path.join(__dirname, '../website/ticket-logs');
                fs.writeFile(`${ticketLogDir}/transcript-${interaction.channel.id}.html`, htmlCode, function (err) {
                    if (err) {
                        console.log(err);
                    }
                });

                const embed = new EmbedBuilder()
                    .setAuthor({ name: 'Logs Ticket', iconURL: client.config.EMBED.IMAGE })
                    .setDescription(`📰 Logs of the ticket \`${chan.id}\` created by <@!${ticketDoc.userID}> and deleted by <@!${interaction.user.id}>\n\nLogs: [**Click here to see the logs**](${serverAdd}/transcript-${interaction.channel.id}.html)`)
                    .setColor('#206694')
                    .setTimestamp();

                client.channels.cache.get(IdData.ticketLogChannelID).send({
                    embeds: [embed]
                });

                client.users.cache.get(ticketDoc.userID).send({
                    embeds: [embed]
                }).catch(error => {
                    if (error.code == 50007) {
                        const logembed = new EmbedBuilder()
                            .setColor('#000000')
                            .setDescription(`Unable to DM User: <@${ticketDoc.userID}>\n\`Ticket No: ${chan.id}\``)

                        return client.channels.cache.get(IdData.ticketLogChannelID).send({
                            embeds: [logembed]
                        });
                    }
                });
                setTimeout(async () => {
                    chan.delete()
                        .catch(error => {
                            if (error.code == 10003) {
                                return; //channel not found error
                            }
                        });
                    await ticketDoc.deleteOne();
                }, 2000);

                setTimeout(() => buttonCooldown.delete(interaction.user.id), 2000)
            }
        };

        if (interaction.customId == "delete-ticket-reason") {
            const reasonModal = new ModalBuilder()
                .setCustomId('ticket-reason-modal')
                .setTitle('Ticket Reason');

            const Reason = new TextInputBuilder()
                .setCustomId('ticket-reason-text')
                .setLabel('Ticket Close Text')
                .setMaxLength(1000)
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const firstActionRow = new ActionRowBuilder().addComponents(Reason);
            reasonModal.addComponents(firstActionRow);
            await interaction.showModal(reasonModal);
        }

        if (interaction.customId == "ticket-reason-modal") {

            await interaction.deferReply({ ephemeral: true });

            if (buttonCooldown.has(interaction.user.id)) {
                const replyEmbed = new EmbedBuilder()
                    .setColor('#ED4245')
                    .setDescription("Interaction not registered! (Button Spam Dedected!)")
                await interaction.editReply({ embeds: [replyEmbed], ephemeral: true });
            } else {

                buttonCooldown.add(interaction.user.id);

                const TicketReason = interaction.fields.getTextInputValue('ticket-reason-text');

                const ticketDoc = await ticketModel.findOne({
                    ticketID: interaction.channel.id
                }).catch(err => console.log(err));

                if (!ticketDoc) {
                    return await interaction.editReply({ content: "Internal Error Occured. Delete Ticket Manually || Database missing", ephemeral: true });
                }

                var IdData = await ticketData.findOne({
                    ticketGuildID: interaction.guild.id
                }).catch(err => console.log(err));

                const guild = client.guilds.cache.get(interaction.guildId);
                const chan = guild.channels.cache.get(interaction.channelId);
                if (chan == null) return;

                await interaction.editReply({
                    content: 'Saving Messages and Deleting the channel ...',
                    ephemeral: true
                });

                const htmlCode = await discordTranscripts.createTranscript(chan, {
                    limit: -1,
                    returnType: 'string',
                    filename: `transcript-${interaction.channel.id}.html`,
                    saveImages: false,
                    poweredBy: false
                });

                const serverAdd = `${process.env.SERVERADD}`;
                const ticketLogDir = path.join(__dirname, '../website/ticket-logs');
                fs.writeFile(`${ticketLogDir}/transcript-${interaction.channel.id}.html`, htmlCode, function (err) {
                    if (err) {
                        console.log(err);
                    }
                });

                const embed = new EmbedBuilder()
                    .setAuthor({ name: 'Logs Ticket', iconURL: client.config.EMBED.IMAGE })
                    .setDescription(`📰 Logs of the ticket \`${chan.id}\` created by <@!${ticketDoc.userID}> and deleted by <@!${interaction.user.id}>\n\nLogs: [**Click here to see the logs**](${serverAdd}/transcript-${interaction.channel.id}.html)`)
                    .setColor('#206694')
                    .addFields(
                        { name: 'Reason', value: `\`\`\`${TicketReason}\`\`\`` || 'No Reason' }
                    )
                    .setTimestamp();

                client.channels.cache.get(IdData.ticketLogChannelID).send({
                    embeds: [embed]
                });

                client.users.cache.get(ticketDoc.userID).send({
                    embeds: [embed]
                }).catch(error => {
                    if (error.code == 50007) {
                        const logembed = new EmbedBuilder()
                            .setColor('#000000')
                            .setDescription(`Unable to DM User: <@${ticketDoc.userID}>\n\`Ticket No: ${chan.id}\``)

                        return client.channels.cache.get(IdData.ticketLogChannelID).send({
                            embeds: [logembed]
                        });
                    }
                });
                setTimeout(async () => {
                    chan.delete()
                        .catch(error => {
                            if (error.code == 10003) {
                                return; //channel not found error
                            }
                        });
                    await ticketDoc.deleteOne();
                }, 2000);
                setTimeout(() => buttonCooldown.delete(interaction.user.id), 2000)
            }
        }
    }
}