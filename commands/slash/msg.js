const {
    SlashCommandBuilder,
    EmbedBuilder,
    ChannelType,
    PermissionFlagsBits
} = require('discord.js');
const wait = require('util').promisify(setTimeout);

module.exports = {
    cooldown: 10000,
    userPerms: [],
    botPerms: [],

    data: new SlashCommandBuilder()
        .setName('msg')
        .setDescription('Sends Message')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('announce')
                .setDescription('Announcement Channel Message!')
                .addChannelOption(option => option
                    .setName('channel-ann')
                    .setDescription('Channel to send message')
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName('text-ann')
                    .setDescription('Message to be sent')
                    .setRequired(true)
                ),

        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('default')
                .setDescription('Text Channel or Ban/Warning Message!')
                .addChannelOption(option => option
                    .setName('channel-ban')
                    .setDescription('Channel to send message')
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName('text-ban')
                    .setDescription('Message to be sent')
                    .setRequired(true)
                ),

        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('embed')
                .setDescription('Send Embed Message!')
                .addChannelOption(option => option
                    .setName('channel-embed')
                    .setDescription('Channel to send message')
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName('text-embed')
                    .setDescription('Message to be sent')
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName('color-embed')
                    .setDescription('Select the color of the embed!')
                    .setRequired(true)
                    .addChoices(
                        { name: 'RED', value: 'FF0000' },
                        { name: 'Green', value: '00FF00' },
                        { name: 'Orange', value: 'FFA500' },
                    )
                ),

        ),

    async execute(interaction, client) {

        const commandName = "MSG";
        client.std_log.error(client, commandName, interaction.user.id, interaction.channel.id);

        async function logEmbedSend(command, channelId, userId, msg) {
            const logEmbed = new EmbedBuilder()
            .setColor('Blue')
            .setDescription(`Command \`/msg ${command} ${msg}\``)
            .addFields(
                { name: 'Client', value: `<@${userId}>`},
                { name: 'Target Channel', value: `<#${channelId}>`},
            )

            await client.channels.cache.get('1059443607112790016').send({
                embeds: [logEmbed]
            });
        }

        if (interaction.options.getSubcommand() === "announce") {

            const channel = await interaction.options.getChannel("channel-ann");
            const text = await interaction.options.getString("text-ann");

            if (channel.type !== ChannelType.GuildAnnouncement) {
                const ReplyEmbed = new EmbedBuilder()
                    .setColor("#ED4245")
                    .setDescription('Select only ANNOUNCEMENT Channel!');

                return interaction.reply({
                    embeds: [ReplyEmbed],
                    ephemeral: true
                });
            }

            await logEmbedSend('announce', channel.id, interaction.user.id, text);

            await channel.send({
                content: text

            }).then(() => {
                const ReplyEmbed = new EmbedBuilder()
                    .setColor("#00FF00")
                    .setDescription('Message Sent!');

                return interaction.reply({
                    embeds: [ReplyEmbed],
                    ephemeral: true
                });
            });

        }


        if (interaction.options.getSubcommand() === "default") {

            const channel = await interaction.options.getChannel("channel-ban");
            const text = await interaction.options.getString("text-ban");

            if (channel.type !== ChannelType.GuildText) {
                const ReplyEmbed = new EmbedBuilder()
                    .setColor("#ED4245")
                    .setDescription('Select only Guild Text Channel!');

                return interaction.reply({
                    embeds: [ReplyEmbed],
                    ephemeral: true
                });
            }

            await logEmbedSend('default', channel.id, interaction.user.id, text);

            await channel.send({
                content: text

            }).then(() => {
                const ReplyEmbed = new EmbedBuilder()
                    .setColor("#00FF00")
                    .setDescription('Message Sent!');

                return interaction.reply({
                    embeds: [ReplyEmbed],
                    ephemeral: true
                });
            });

        }


        if (interaction.options.getSubcommand() === "embed") {

            const channel = await interaction.options.getChannel("channel-embed");
            const text = await interaction.options.getString("text-embed");
            const color = await interaction.options.getString("color-embed");

            if (channel.type == ChannelType.GuildVoice || channel.type == ChannelType.GuildCategory || channel.type == ChannelType.DM || channel.type == ChannelType.GuildStageVoice || channel.type == ChannelType.GuildForum) {
                const ReplyEmbed = new EmbedBuilder()
                    .setColor("#ED4245")
                    .setDescription('Select only Guild Text Channel!');

                return interaction.reply({
                    embeds: [ReplyEmbed],
                    ephemeral: true
                });
            }

            await logEmbedSend('embed', channel.id, interaction.user.id, text);

            const embed = new EmbedBuilder()
                .setColor(`#${color}`)
                .setDescription(text)

            await channel.send({
                embeds: [embed]

            }).then(() => {
                const ReplyEmbed = new EmbedBuilder()
                    .setColor("#00FF00")
                    .setDescription('Message Sent!');

                return interaction.reply({
                    embeds: [ReplyEmbed],
                    ephemeral: true
                });
            });
        }
    }
};