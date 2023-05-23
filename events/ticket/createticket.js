const {
    ChannelType,
    PermissionFlagsBits,
    ComponentType,
    Events,
} = require('discord.js');
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder
} = require("discord.js");

const ticketModel = require('../../events/models/ticket.js');
const ticketData = require("../../events/models/channel.js");
const guildModel = require('../../events/models/guild.js');
const ticketPar = require('../../events/models/ticketParent.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        const errChan = client.config.ERR_LOG.CHAN_ID;
        const errorSend = client.channels.cache.get(errChan);

        if (!interaction.isButton()) return;

        if (interaction.customId == "open-ticket") {

            var ticketCheck = await ticketModel.findOne({
                guildID: interaction.guild.id,
                userID: interaction.user.id
            }).catch(err => console.log(err));

            if (ticketCheck) {
                await interaction.reply({
                    content: '**You have already created a ticket! Kindly Contact any Ticket Supporters if not!**',
                    ephemeral: true
                });

                const ticEmbed = new EmbedBuilder()
                    .setColor('#3498DB')
                    .setDescription("Unable to open a new Ticket")
                    .addFields(
                        { name: 'User', value: `<@!${interaction.user.id}>` },
                        { name: 'Reason', value: "has already opened a Ticket" }
                    );
                return errorSend.send({ embeds: [ticEmbed] });
            }

            var IdData = await ticketData.findOne({
                ticketGuildID: interaction.guild.id
            }).catch(err => console.log(err));

            var guildDoc = await guildModel.findOne({
                guildID: interaction.guild.id
            }).catch(err => console.log(err));

            if (!guildDoc) {
                guildDoc = new guildModel({
                    guildID: interaction.guild.id,
                    ticketCount: 0
                });
                await guildDoc.save();
            }

            guildDoc.ticketCount += 1;
            await guildDoc.save();

            var ticketParents = await ticketPar.findOne({
                guildID: interaction.guild.id
            }).catch(err => console.log(err));

            var mainTicket;
            if (!ticketParents) {
                return await interaction.reply({ content: 'Setup is incomplete :(', ephemeral: true });

            } else if (ticketParents) {
                mainTicket = ticketParents.mainPar;
            }

            var ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${guildDoc.ticketCount}-${interaction.user.username}`,
                parent: mainTicket,
                topic: interaction.user.username,
                permissionOverwrites: [
                    {
                        id: interaction.user.id,
                        allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
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
                type: ChannelType.GuildText,
            }).then(async c => {
                await interaction.reply({
                    content: `Ticket created! <#${c.id}>`,
                    ephemeral: true
                }).catch(error => {
                    if (error.code == 10062) {
                        console.error('Interaction Error | Creating Ticket | Line: 108');
                    }
                });

                const embed = new EmbedBuilder()
                    .setColor('#206694')
                    .setAuthor({ name: 'Ticket', iconURL: client.config.EMBED.IMAGE })
                    .setDescription('Select the category of your ticket')
                    .setFooter({ text: client.config.EMBED.FOOTTEXT, iconURL: client.user.avatarURL() })
                    .setTimestamp();

                const row = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('category')
                            .setPlaceholder('Select the ticket category')
                            .addOptions([
                                {
                                    label: 'OOC',
                                    value: 'Ooc',
                                    emoji: '📝',
                                },
                                {
                                    label: 'BUGS',
                                    value: 'Bugs',
                                    emoji: '🐛',
                                },
                                {
                                    label: 'SUPPORTERS PACK',
                                    value: 'Supporters',
                                    emoji: '💎',
                                },
                                {
                                    label: 'CHARACTER ISSUE',
                                    value: 'Character',
                                    emoji: '🪲',
                                },
                                {
                                    label: 'OTHERS',
                                    value: 'Others',
                                    emoji: '📙',
                                },
                            ]),
                    );

                msg = await c.send({
                    content: `<@!${interaction.user.id}>`,
                    embeds: [embed],
                    components: [row]
                });

                var ticketDoc = await new ticketModel({
                    guildID: interaction.guild.id,
                    userID: interaction.user.id,
                    ticketID: c.id,
                    ticketStatus: false,
                    msgID: msg.id
                });
                await ticketDoc.save();

                const collector = await msg.createMessageComponentCollector({
                    componentType: ComponentType.SelectMenu,
                    time: 30000
                });

                collector.on('collect', async (i) => {
                    if (i.user.id === interaction.user.id) {
                        if (msg && msg.deletable) {
                            msg.delete().then(async () => {
                                const embed = new EmbedBuilder()
                                    .setColor('#206694')
                                    .setAuthor({ name: 'Ticket', iconURL: client.config.EMBED.IMAGE })
                                    .setDescription(`<@!${interaction.user.id}> Created a ticket ${i.values[0]}`)
                                    .setFooter({ text: client.config.EMBED.FOOTTEXT, iconURL: client.config.EMBED.IMAGE })
                                    .setTimestamp();

                                const row = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder()
                                            .setCustomId('close-ticket')
                                            .setLabel('Close Ticket')
                                            .setEmoji('899745362137477181')
                                            .setStyle(ButtonStyle.Danger),
                                        new ButtonBuilder()
                                            .setCustomId('transcript-ticket')
                                            .setLabel('Transcript')
                                            .setEmoji('📜')
                                            .setStyle(ButtonStyle.Primary),
                                    );

                                const opened = await c.send({
                                    content: `**Your Ticket Has Been Created!**`,
                                    embeds: [embed],
                                    components: [row]
                                });

                                opened.pin().then(() => {
                                    opened.channel.bulkDelete(1);
                                });

                                ticketDoc.msgPannelID = opened.id;
                                ticketDoc.ticketStatus = true;
                                await ticketDoc.save();
                            }).catch(async (error) => {
                                console.error('Error deleting the message:', error);
                                if (msg.channel.deletable) {
                                    await msg.channel.delete()
                                        .then(() => {
                                            const user = client.users.cache.get(i.user.id);
                                            if (user) {
                                                user.send('Ticket Closed! | Reopen Again | Ticket Bugged');
                                            }
                                        })
                                        .catch((error) => {
                                            // Channel deletion failed, handle the error
                                            console.error('Error deleting the channel:', error);
                                        });
                                } else {
                                    console.log('The channel is not deletable.');
                                }
                            });
                        }

                        if (i.values[0] == 'Ooc') {
                            await c.edit({
                                parent: ticketParents.oocPar
                            }).catch(async (error) => {
                                if (error.code == 50035) {
                                    await c.send(`OOC category has **TOO many pending tickets**! Try again later.`)
                                        .then(() => {
                                            setTimeout(async () => {
                                                if (c.deletable) {

                                                    const deletableTicket = await ticketModel.findOne({
                                                        ticketID: c.id
                                                    }).catch(err => console.log(err));
                                                    await await deletableTicket.deleteOne();

                                                    await c.delete().catch(err => {
                                                        console.error(err);
                                                    });
                                                }
                                            }, 5000);
                                        })
                                        .catch(err => {
                                            console.error(err);
                                        });
                                }
                            });
                        }
                        if (i.values[0] == 'Bugs') {
                            await c.edit({
                                parent: ticketParents.bugPar
                            }).catch(async (error) => {
                                if (error.code == 50035) {
                                    await c.send(`Bugs category has **TOO many pending tickets**! Try again later.`)
                                        .then(() => {
                                            setTimeout(async () => {
                                                if (c.deletable) {

                                                    const deletableTicket = await ticketModel.findOne({
                                                        ticketID: c.id
                                                    }).catch(err => console.log(err));
                                                    await await deletableTicket.deleteOne();

                                                    await c.delete().catch(err => {
                                                        console.error(err);
                                                    });
                                                }
                                            }, 5000);
                                        })
                                        .catch(err => {
                                            console.error(err);
                                        });
                                }
                            });
                        }
                        if (i.values[0] == 'Supporters') {
                            await c.edit({
                                parent: ticketParents.suppPar
                            }).catch(async (error) => {
                                if (error.code == 50035) {
                                    await c.send(`Supporters category has **TOO many pending tickets**! Try again later.`)
                                        .then(() => {
                                            setTimeout(async () => {
                                                if (c.deletable) {

                                                    const deletableTicket = await ticketModel.findOne({
                                                        ticketID: c.id
                                                    }).catch(err => console.log(err));
                                                    await await deletableTicket.deleteOne();

                                                    await c.delete().catch(err => {
                                                        console.error(err);
                                                    });
                                                }
                                            }, 5000);
                                        })
                                        .catch(err => {
                                            console.error(err);
                                        });
                                }
                            });
                        }
                        if (i.values[0] == 'Character') {
                            await c.edit({
                                parent: ticketParents.charPar
                            }).catch(async (error) => {
                                if (error.code == 50035) {
                                    await c.send(`Character category has **TOO many pending tickets**! Try again later.`)
                                        .then(() => {
                                            setTimeout(async () => {
                                                if (c.deletable) {

                                                    const deletableTicket = await ticketModel.findOne({
                                                        ticketID: c.id
                                                    }).catch(err => console.log(err));
                                                    await await deletableTicket.deleteOne();

                                                    await c.delete().catch(err => {
                                                        console.error(err);
                                                    });
                                                }
                                            }, 5000);
                                        })
                                        .catch(err => {
                                            console.error(err);
                                        });
                                }
                            });
                        }
                        if (i.values[0] == 'Others') {
                            await c.edit({
                                parent: ticketParents.otherPar
                            }).catch(async (error) => {
                                if (error.code == 50035) {
                                    await c.send(`Others category has **TOO many pending tickets**! Try again later.`)
                                        .then(() => {
                                            setTimeout(async () => {
                                                if (c.deletable) {

                                                    const deletableTicket = await ticketModel.findOne({
                                                        ticketID: c.id
                                                    }).catch(err => console.log(err));
                                                    await await deletableTicket.deleteOne();

                                                    await c.delete().catch(err => {
                                                        console.error(err);
                                                    });
                                                }
                                            }, 5000);
                                        })
                                        .catch(err => {
                                            console.error(err);
                                        });
                                }
                            });
                        }
                    }
                });


                collector.on('end', async (collected) => {
                    if (collected.size < 1) {
                        c.send(`No category selected. Closing the ticket ...`).then(() => {
                            setTimeout(async () => {
                                if (c.deletable) {
                                    await c.delete().catch(err => { return console.error(err) });
                                }
                            }, 5000);
                        });

                        const ticEmbed2 = new EmbedBuilder()
                            .setColor('#3498DB')
                            .setAuthor({ name: "FIVEM" })
                            .setDescription("Menu Closed")
                            .addFields(
                                { name: 'User', value: `<@!${interaction.user.id}>` },
                                { name: 'Reason', value: "No Category Selected" }
                            );
                        errorSend.send({ embeds: [ticEmbed2] });
                        await ticketDoc.deleteOne();
                    }
                });
            });
        }
    }
};