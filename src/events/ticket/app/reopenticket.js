const {
    Events,
    ComponentType,
    PermissionFlagsBits
} = require('discord.js');

const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const ticketModel = require('../../../events/mongodb/modals/ticket.js');
const ticketPar = require('../../../events/mongodb/modals/ticketParent.js');
const ticketData = require("../../../events/mongodb/modals/channel.js");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        if (interaction.customId == "reopen-ticket") {

            var ticketCheck = await ticketModel.findOne({
                guildID: interaction.guild.id,
                ticketID: interaction.channel.id
            }).catch(err => console.log(err));

            var ticketParents = await ticketPar.findOne({
                guildID: interaction.guild.id
            }).catch(err => console.log(err));

            const IdData = await ticketData.findOne({
                ticketGuildID: interaction.guild.id
            }).catch(err => console.log(err));

            if (!ticketCheck) return interaction.reply({
                content: `Cannot reopen: Ticket not in database!`,
                ephemeral: true
            });

            if (!ticketParents || !IdData) return interaction.reply({
                content: 'Setup is incomplete :(',
                ephemeral: true
            });

            if (!ticketCheck.msgPannelID) return interaction.reply({
                content: 'This feature is only available on newer tickets.',
                ephemeral: true
            });

            await interaction.deferReply();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('reopen-ticket-yes')
                        .setLabel('Confirm')
                        .setStyle(ButtonStyle.Success),

                    new ButtonBuilder()
                        .setCustomId('reopen-ticket-no')
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Secondary),
                );

            const verif = await interaction.editReply({
                content: 'Are you sure you want to reopen the ticket?',
                components: [row]
            });

            const collector = verif.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 15000
            });
            const userButton = interaction.user.id;

            collector.on('collect', async (i) => {
                await i.deferUpdate();

                if (i.customId == 'reopen-ticket-yes') {
                    await i.editReply({
                        content: `**Reopening ticket ...** (<@!${userButton}>)`,
                        components: []
                    });

                    ticketCheck.ticketStatus = true;
                    await ticketCheck.save();

                    var ticketNumber = /^\d+$/.test(interaction.channel.topic) ? parseInt(interaction.channel.topic) : 0;
                    var userInfo = client.users.cache.get(ticketCheck.userID);

                    await interaction.channel.edit({
                        name: `ticket-${ticketNumber}-${userInfo.username}`,
                        parent: ticketParents.mainPar,
                        permissionOverwrites: [
                            {
                                id: ticketCheck.userID,
                                allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
                                deny: [PermissionFlagsBits.MentionEveryone]
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
                        let message = await interaction.channel.messages.fetch(ticketCheck.msgPannelID);
                        if (!message) return;
                        const updatedRow = new ActionRowBuilder()
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
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(true),
                            );

                        await message.edit({ components: [updatedRow] });

                        const editoriginalButton = new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('delete-ticket')
                                    .setLabel('Delete Ticket')
                                    .setEmoji('🗑️')
                                    .setStyle(ButtonStyle.Danger)
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('delete-ticket-reason')
                                    .setLabel('Delete with Reason')
                                    .setEmoji('📄')
                                    .setStyle(ButtonStyle.Danger)
               
                                    .setDisabled(true),
                                new ButtonBuilder()
                                    .setCustomId('reopen-ticket')
                                    .setLabel('Reopen Ticket')
                                    .setEmoji('🔓')
                                    .setStyle(ButtonStyle.Success)
                                    .setDisabled(true),
                            );
                        await interaction.message.edit({ components: [editoriginalButton] });
                        collector.stop();
                    });
                }

                if (i.customId == 'reopen-ticket-no') {
                    await i.editReply({
                        content: `**Ticket reopen cancelled!** (<@${i.user.id}>)`,
                        components: []
                    });
                    collector.stop();
                }
            });

            collector.on('end', async (collected) => {
                if (collected.size <= 0) {
                    await interaction.editReply({
                        content: `**Reopening ticket canceled!** (<@!${userButton}>)`,
                        components: []
                    });
                }
            });
        }
    }
}