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
        .setName('editmsg')
        .setDescription('Edits a Message')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('text')
                .setDescription('Edits a text message by the bot')
                .addStringOption(option => option
                    .setName('message-id')
                    .setDescription('Bot message ID')
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName('text-edit')
                    .setDescription('Message to be edited!')
                    .setRequired(true)
                ),

        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('embed')
                .setDescription('Edits a embed message by the bot')
                .addStringOption(option => option
                    .setName('message-id')
                    .setDescription('Bot message ID')
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName('text-edit')
                    .setDescription('Message to be edited!')
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName('color-embed')
                    .setDescription('Select the color of the embed!')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Red', value: 'FF0000' },
                        { name: 'Green', value: '00FF00' },
                        { name: 'Orange', value: 'FFA500' },
                    )
                ),

        ),

    async execute(interaction, client) {

        const commandName = "EDITMSG";
        client.std_log.error(client, commandName, interaction.user.id, interaction.channel.id);

        async function logEmbedSend(command, channelId, userId, msg) {
            const logEmbed = new EmbedBuilder()
                .setColor('Blue')
                .setDescription(`Command \`/msg ${command} ${msg}\``)
                .addFields(
                    { name: 'Client', value: `<@${userId}>` },
                    { name: 'Message ID', value: `${channelId}` },
                )

            await client.channels.cache.get('1059443607112790016').send({
                embeds: [logEmbed]
            });
        }


        if (interaction.options.getSubcommand() === "text") {

            const messageId = await interaction.options.getString("message-id");
            const text = await interaction.options.getString("text-edit");

            let channel;
            try {
                const fetchedMessage = await interaction.channel.messages.fetch(messageId);
                channel = fetchedMessage.channel;
            } catch (error) {
                console.log(error);
                return interaction.reply({ content: 'Invalid message ID!', ephemeral: true });
            }

            await logEmbedSend('text', messageId, interaction.user.id, text);

            try {
                const fetchedMessage = await channel.messages.fetch(messageId);
                await fetchedMessage.edit({
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
            } catch (error) {
                console.log(error);
                return interaction.reply({ content: 'Failed to edit message!', ephemeral: true });
            }
        }


        if (interaction.options.getSubcommand() === "embed") {

            const messageId = await interaction.options.getString("message-id");
            const text = await interaction.options.getString("text-edit");
            const color = await interaction.options.getString("color-embed");

            let channel;
            try {
                const fetchedMessage = await interaction.channel.messages.fetch(messageId);
                channel = fetchedMessage.channel;
            } catch (error) {
                console.log(error);
                return interaction.reply({ content: 'Invalid message ID!', ephemeral: true });
            }

            await logEmbedSend('embed', messageId, interaction.user.id, text);

            try {
                const fetchedMessage = await channel.messages.fetch(messageId);
                const embed = new EmbedBuilder()
                    .setColor(`#${color}`)
                    .setDescription(text)

                await await fetchedMessage.edit({
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
            } catch (error) {
                console.log(error);
                return interaction.reply({ content: 'Failed to edit message!', ephemeral: true });
            }
        }
    }
};