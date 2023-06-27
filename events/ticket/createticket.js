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
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
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

        //if (!interaction.isButton()) return;

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
                                /*{
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
                                },*/
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

                        if (i.values[0] == 'Ooc') {

                            const oocModal = new ModalBuilder()
                                .setCustomId('ticket-ooc-modal')
                                .setTitle('Ticket Details');

                            const oocDate = new TextInputBuilder()
                                .setCustomId('ooc-date')
                                .setLabel('Date and Time of the Scenario:')
                                .setPlaceholder('Approximate Time is also acceptable')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true);
                            const oocAgainst = new TextInputBuilder()
                                .setCustomId('ooc-against')
                                .setLabel('Ticket Raised Against:')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(false);
                            const oocDetails = new TextInputBuilder()
                                .setCustomId('ooc-details')
                                .setLabel('Ticket raised because of:')
                                .setStyle(TextInputStyle.Paragraph)
                                .setMaxLength(1000)
                                .setRequired(true);
                            const oocProof = new TextInputBuilder()
                                .setCustomId('ooc-proof')
                                .setLabel('Proof')
                                .setPlaceholder('Yes/No')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(false);
                            const oocRules = new TextInputBuilder()
                                .setCustomId('ooc-rules')
                                .setLabel('RP Rules Breaked (Fail RP)')
                                .setPlaceholder('Power Gaming/Fear RP/Meta Gaming/Fear RP')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true);

                            const firstActionRow = new ActionRowBuilder().addComponents(oocDate);
                            const secondActionRow = new ActionRowBuilder().addComponents(oocAgainst);
                            const thirdActionRow = new ActionRowBuilder().addComponents(oocDetails);
                            const fourthActionRow = new ActionRowBuilder().addComponents(oocProof);
                            const fivethActionRow = new ActionRowBuilder().addComponents(oocRules);

                            oocModal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow, fivethActionRow);
                            await i.showModal(oocModal);

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
                        /*if (i.values[0] == 'Bugs') {
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
                        }*/
                        if (i.values[0] == 'Others') {

                            const othersModal = new ModalBuilder()
                                .setCustomId('ticket-others-modal')
                                .setTitle('Ticket Details');

                            const othersDate = new TextInputBuilder()
                                .setCustomId('others-date')
                                .setLabel('Date and Time:')
                                .setPlaceholder('Approximate Time is also acceptable')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true);
                            const othersDetails = new TextInputBuilder()
                                .setCustomId('others-details')
                                .setLabel('Ticket raised because of:')
                                .setPlaceholder('Items lost/Name Change/Bugs')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true);
                            const othersItems = new TextInputBuilder()
                                .setCustomId('others-items')
                                .setLabel('If Items Lost, Mention Them')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(false);
                            const othersProof = new TextInputBuilder()
                                .setCustomId('others-proof')
                                .setLabel('Proof')
                                .setPlaceholder('Yes/No')
                                .setStyle(TextInputStyle.Short)
                                .setRequired(false);

                            const firstActionRow = new ActionRowBuilder().addComponents(othersDate);
                            const secondActionRow = new ActionRowBuilder().addComponents(othersDetails);
                            const thirdActionRow = new ActionRowBuilder().addComponents(othersItems);
                            const fourthActionRow = new ActionRowBuilder().addComponents(othersProof);

                            othersModal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);
                            await i.showModal(othersModal);

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
                                        new ButtonBuilder()
                                            .setCustomId('claim-ticket')
                                            .setLabel('Claim')
                                            .setEmoji('🔒')
                                            .setStyle(ButtonStyle.Secondary),
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
                                console.error('Error deleting the message:', error);
                            });
                        }
                    }
                });

                collector.on('end', async (collected) => {
                    if (collected.size < 1) {
                        c.send(`No category selected. Closing the ticket ...`).then(() => {
                            setTimeout(async () => {
                                if (c.deletable) {
                                    await c.delete().catch(err => { return console.error(err); });
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

        if (interaction.customId == "ticket-ooc-modal") {
            const Date = interaction.fields.getTextInputValue('ooc-date');
            const Against = interaction.fields.getTextInputValue('ooc-against') || "Name Unknown";
            const Rules = interaction.fields.getTextInputValue('ooc-rules');
            const Proof = interaction.fields.getTextInputValue('ooc-proof') || "No Proof";
            const Details = interaction.fields.getTextInputValue('ooc-details');

            const embed = new EmbedBuilder()
                .setDescription(`<@${interaction.user.id}> **| OOC Ticket Details**`)
                .addFields(
                    { name: '**Date and Time:**', value: `\`\`\`${Date}\`\`\`` },
                    { name: '**OOC Against:**', value: `\`\`\`${Against}\`\`\`` },
                    { name: '**Rules Breaked:**', value: `\`\`\`${Rules}\`\`\`` },
                    { name: '**Ticket Raised Because Of:**', value: `\`\`\`${Details}\`\`\`` },
                    { name: '**Proof/Evidence:**', value: `\`\`\`${Proof}\`\`\`` }
                );
            await interaction.channel.send({ embeds: [embed] });
            interaction.reply({ content: "Detail Submitted!", ephemeral: true });
        }

        if (interaction.customId == "ticket-others-modal") {
            const Date = interaction.fields.getTextInputValue('others-date');
            const Details = interaction.fields.getTextInputValue('others-details');
            const Items = interaction.fields.getTextInputValue('others-items') || "No Item Lost";
            const Proof = interaction.fields.getTextInputValue('others-proof') || "No Proof";

            const embed = new EmbedBuilder()
                .setDescription(`<@${interaction.user.id}> **| Others Ticket Details**`)
                .addFields(
                    { name: '**Date and Time:**', value: `\`\`\`${Date}\`\`\`` },
                    { name: '**Ticket Raised Because Of:**', value: `\`\`\`${Details}\`\`\`` },
                    { name: '**Items Lost:**', value: `\`\`\`${Items}\`\`\`` },
                    { name: '**Proof/Evidence:**', value: `\`\`\`${Proof}\`\`\`` }
                );
            await interaction.channel.send({ embeds: [embed] });
            interaction.reply({ content: "Detail Submitted!", ephemeral: true });
        }
    }
};