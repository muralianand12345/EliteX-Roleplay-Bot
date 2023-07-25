const {
    PermissionFlagsBits,
    ComponentType,
    Events,
} = require('discord.js');
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const ticketModel = require('../../../events/mongodb/modals/ticket.js');
const ticketData = require("../../../events/mongodb/modals/channel.js");
const ticketPar = require('../../../events/mongodb/modals/ticketParent.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        try {
            if (interaction.customId == "close-ticket") {

                await interaction.deferReply();

                const IdData = await ticketData.findOne({
                    ticketGuildID: interaction.guild.id
                }).catch(err => console.log(err));

                if (!IdData) {
                    return;
                }

                const ticketDoc = await ticketModel.findOne({
                    ticketID: interaction.channel.id
                }).catch(err => console.log(err));

                var ticketParents = await ticketPar.findOne({
                    guildID: interaction.guild.id
                }).catch(err => console.log(err));

                if (!ticketParents) {
                    return;
                } else if (ticketParents) {
                    var closeTicket = ticketParents.closedPar;
                }

                const userButton = interaction.user.id;
                const guild = client.guilds.cache.get(interaction.guildId);
                const chan = guild.channels.cache.get(interaction.channelId);

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

                const editoriginalButton = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('close-ticket')
                            .setLabel('Close Ticket')
                            .setEmoji('899745362137477181')
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('transcript-ticket')
                            .setLabel('Transcript')
                            .setEmoji('📜')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('claim-ticket')
                            .setLabel('Claim')
                            .setEmoji('🔒')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true),
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
                        if (!i) {
                            await interaction.editReply({ content: `Error Occured! Try again...`, components: [] });
                            return collector.stop();
                        } else {
                            try {
                                await interaction.message.edit({ components: [editoriginalButton] })
                                await i.editReply({
                                    content: `Ticket closed by <@!${i.user.id}>`,
                                    components: []
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

                            chan.edit({
                                name: `ticket-closed`,
                                parent: closeTicket,
                                permissionOverwrites: [
                                    {
                                        id: ticketDoc.userID,
                                        deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
                                    },
                                    {
                                        id: IdData.ticketSupportID,
                                        allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
                                    },
                                    {
                                        id: interaction.guild.roles.everyone,
                                        deny: [PermissionFlagsBits.ViewChannel],
                                    },
                                ],
                            }).then(async () => {
                                const embed = new EmbedBuilder()
                                    .setColor('#206694')
                                    .setAuthor({ name: 'Ticket', iconURL: client.config.EMBED.IMAGE })
                                    .setDescription('```Ticket Supporters, Delete After Verifying```')
                                    .setFooter({ text: client.config.EMBED.FOOTTEXT, iconURL: client.config.EMBED.IMAGE })
                                    .setTimestamp();

                                const row = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('delete-ticket')
                                            .setLabel('Delete ticket')
                                            .setEmoji('🗑️')
                                            .setStyle(ButtonStyle.Danger),
                                        new ButtonBuilder()
                                            .setCustomId('delete-ticket-reason')
                                            .setLabel('Delete with Reason')
                                            .setEmoji('📄')
                                            .setStyle(ButtonStyle.Danger),
                                    );

                                chan.send({
                                    embeds: [embed],
                                    components: [row]
                                });

                                ticketDoc.msgPannelID = null;
                                ticketDoc.ticketStatus = false;
                                await ticketDoc.save();
                            });

                            collector.stop();
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