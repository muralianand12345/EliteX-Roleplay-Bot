const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    PermissionFlagsBits
} = require('discord.js');

const channelData = require("../../events/mongodb/modals/channel.js")
const parentData = require("../../events/mongodb/modals/ticketParent.js")

module.exports = {
    cooldown: 10000,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],

    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription("Setup or stop the tickets system in your server!")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup the tickets system for your server!')
                .addChannelOption(option => option
                    .setName('channel')
                    .setDescription('Set the channel for the ticket!')
                    .setRequired(true)
                )
                .addChannelOption(option => option
                    .setName('logchannel')
                    .setDescription('Set the Log channel for the ticket!')
                    .setRequired(true)
                )
                .addRoleOption(option => option
                    .setName('supportrole')
                    .setDescription('Ticket Supporters Role!')
                    .setRequired(true)
                ),

        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stop')
                .setDescription('Stop the tickets system for your server!'),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('category-setup')
                .setDescription('Set the categorys for the ticket!')
                .addChannelOption(option => option
                    .setName('ooc')
                    .setDescription('OOC Category')
                    .setRequired(true)
                )
                .addChannelOption(option => option
                    .setName('supporters')
                    .setDescription('Supporters Pack Category')
                    .setRequired(true)
                )
                /*.addChannelOption(option => option
                    .setName('bug')
                    .setDescription('Bugs Category')
                    .setRequired(true)
                )
                .addChannelOption(option => option
                    .setName('character')
                    .setDescription('Character Issue Category')
                    .setRequired(true)
                )*/
                .addChannelOption(option => option
                    .setName('other')
                    .setDescription('Other Issues Category')
                    .setRequired(true)
                )
                .addChannelOption(option => option
                    .setName('closed')
                    .setDescription('Closed Ticket Category')
                    .setRequired(true)
                ),
        ),

    async execute(interaction, client) {

        //log
        const commandName = "TICKET";
        client.std_log.error(client, commandName, interaction.user.id, interaction.channel.id);

        if (interaction.options.getSubcommand() === "setup") {
            const channel = await interaction.options.getChannel("channel");
            const logChannel = await interaction.options.getChannel("logchannel");
            const suppRole = await interaction.options.getRole("supportrole");

            //finding the data
            const data = await channelData.findOne({
                ticketGuildID: interaction.guild.id,
            }).catch(console.error);

            if (data) {
                return interaction.reply({ content: 'Ticket System Already Registered!', ephemeral: true });
            } else if (!data) {
                let newData = new channelData({
                    ticketGuildID: interaction.guild.id,
                    ticketChannelID: channel.id,
                    ticketSupportID: suppRole.id,
                    ticketLogChannelID: logChannel.id
                });
                await newData.save();

                const embed = new EmbedBuilder()
                    .setColor('#6d6ee8')
                    .setTitle("Open a Support Ticket")
                    .setDescription('Click on the button to Raise Ticket')
                    .setFooter({ text: client.config.EMBED.FOOTTEXT, iconURL: client.user.avatarURL() })
                const button = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('open-ticket')
                            .setLabel('TICKET')
                            .setEmoji('🎫')
                            .setStyle(ButtonStyle.Success),
                    );

                channel.send({
                    embeds: [embed],
                    components: [button]
                });

                return interaction.reply({ content: 'Ticket System Setup Successfully!', ephemeral: true });
            }
        } else if (interaction.options.getSubcommand() === "stop") {
            const data = await channelData.findOne({
                ticketGuildID: interaction.guild.id
            }).catch(console.error);

            if (data) {
                await channelData.findOneAndRemove({
                    ticketGuildID: interaction.guild.id
                });

                return interaction.reply({ content: 'Ticket System has been disabled from this server!', ephemeral: true });
            } else if (!data) {
                return interaction.reply({ content: `Ticket system isn't enabled for your server!`, ephemeral: true });
            }
        } else if (interaction.options.getSubcommand() === "category-setup") {
            const oocPar = await interaction.options.getChannel("ooc");
            const supPar = await interaction.options.getChannel("supporters");
            /*const bugPar = await interaction.options.getChannel("bug");
            const charPar = await interaction.options.getChannel("character");*/
            const otherPar = await interaction.options.getChannel("other");
            const closedPar = await interaction.options.getChannel("closed");

            var bool = false;
            function checkParent(chan) {
                if (chan.type !== ChannelType.GuildCategory) {
                    return bool = true;
                } else {
                    return;
                }
            }
            checkParent(oocPar);
            checkParent(supPar);
            /*checkParent(bugPar);
            checkParent(charPar);*/
            checkParent(otherPar);
            checkParent(closedPar);

            if (bool == false) {
                const data = await parentData.findOne({
                    guildID: interaction.guild.id,
                }).catch(console.error);

                if (data) {
                    return interaction.reply({ content: 'Ticket System Already Registered!', ephemeral: true });
                } else if (!data) {
                    let newData = new parentData({
                        guildID: interaction.guild.id,
                        oocPar: oocPar.id,
                        suppPar: supPar.id,
                        /*bugPar: bugPar.id,
                        charPar: charPar.id,*/
                        otherPar: otherPar.id,
                        closedPar: closedPar.id
                    });
                    await newData.save();

                    return interaction.reply({ content: 'Ticket Category Setup Successfully!', ephemeral: true });
                }
            } else if (bool == true) {
                return interaction.reply({ content: 'Kindly Select only Category!', ephemeral: true });
            }
        }
    }
};