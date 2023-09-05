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
} = require("discord.js");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        // ----------------------------------

        const PDTicket = "1123887297822216323";
        const PDHeadRole = "1123600704662151290";
        const PDRoleID = "1123600704662151290";

        // ----------------------------------

        if (!interaction.isButton()) return;

        if (interaction.customId == "police-open-ticket") {
            await interaction.deferReply({ ephemeral: true });

            if (client.guilds.cache.get(interaction.guildId).channels.cache.find(c => c.topic == interaction.user.id)) {
                return await interaction.editReply({
                    content: 'You have already created a ticket!',
                    ephemeral: true
                }).catch(err => console.log(err));
            };

            if (!interaction.member.roles.cache.has(PDRoleID)) {
                return await interaction.editReply({
                    content: 'You do not have ICPD Role!',
                    ephemeral: true
                }).catch(err => console.log(err));
            }

            await interaction.guild.channels.create({
                name: `pd-ticket-${interaction.user.username}`,
                parent: PDTicket,
                topic: interaction.user.id,
                permissionOverwrites: [
                    {
                        id: interaction.user.id,
                        allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
                        deny: [PermissionFlagsBits.MentionEveryone]
                    },
                    {
                        id: PDHeadRole,
                        allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: interaction.guild.roles.everyone,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                ],
                type: ChannelType.GuildText,
            }).then(async c => {
                await interaction.editReply({
                    content: `ICPD Ticket created! <#${c.id}>`,
                    ephemeral: true
                }).catch(error => {
                    if (error.code == 10062) {
                        console.error('Interaction Error | Creating Ticket | Line: 108');
                    }
                });

                const embed = new EmbedBuilder()
                    .setColor('Blue')
                    .setAuthor({ name: 'ICPD Ticket', iconURL: client.config.EMBED.IMAGE })
                    .setDescription('Ticket Created! Wait For PD Heads To Reply.')
                    .setFooter({ text: 'ICPD Ticket', iconURL: client.user.avatarURL() })
                    .setTimestamp();

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('pd-close-ticket')
                            .setLabel('Close Ticket')
                            .setEmoji('899745362137477181')
                            .setStyle(ButtonStyle.Danger),
                    );

                const opened = await c.send({
                    content: `**Your Ticket Has Been Created!**`,
                    embeds: [embed],
                    components: [row]
                });

                opened.pin().then(() => {
                    opened.channel.bulkDelete(1);
                });
            });
        }

        if (interaction.customId == "pd-close-ticket") {

            await interaction.deferReply();

            const chan = interaction.channel;

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('pd-confirm-close-ticket')
                        .setLabel('Delete Ticket')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('pd-no-close-ticket')
                        .setLabel('Cancel Closure')
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

                if (i.customId == 'pd-confirm-close-ticket') {
                    await interaction.editReply({
                        content: `Ticket closed by <@!${i.user.id}>`,
                        components: []
                    });

                    chan.edit({
                        name: `closed-${chan.name}`,
                        permissionOverwrites: [
                            {
                                id: client.users.cache.get(chan.topic),
                                deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
                            },
                            {
                                id: PDHeadRole,
                                allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel],
                            },
                            {
                                id: interaction.guild.roles.everyone,
                                deny: [PermissionFlagsBits.ViewChannel],
                            },
                        ],
                    }).catch(err => console.log(err))
                        .then(async () => {

                            const embed = new EmbedBuilder()
                                .setColor('#206694')
                                .setAuthor({ name: 'ICPD Ticket', iconURL: client.config.EMBED.IMAGE })
                                .setDescription('```ICPD Heads, Delete After Verifying```')
                                .setFooter({ text: client.config.EMBED.FOOTTEXT, iconURL: client.config.EMBED.IMAGE })
                                .setTimestamp();

                            const row = new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('pd-delete-ticket')
                                        .setLabel('Delete Ticket')
                                        .setEmoji('🗑️')
                                        .setStyle(ButtonStyle.Danger),
                                );

                            await interaction.channel.send({
                                embeds: [embed],
                                components: [row]
                            });
                            collector.stop();
                        });
                }
                if (i.customId == 'pd-no-close-ticket') {
                    await interaction.editReply({
                        content: 'Ticket closure cancelled !',
                        components: []
                    });
                    collector.stop();
                };
            });

            collector.on('end', async (i) => {
                if (i.size < 1) {
                    await interaction.editReply({
                        content: 'Closing of the canceled ticket!',
                        components: []
                    });
                };
            });
        }

        if (interaction.customId == "pd-delete-ticket") {
            await interaction.deferReply({ ephemeral: true });
            await interaction.editReply({ content: "Deleting Channel ...", ephemeral: true });
            setTimeout(async () => await interaction.channel.delete().catch(err => console.log(err)), 5000);
        };
    }
}