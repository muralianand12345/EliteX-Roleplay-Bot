const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const blockUserModel = require("../../events/mongodb/modals/blockusers.js");

module.exports = {
    cooldown: 2000,

    data: new SlashCommandBuilder()
        .setName('blockuser')
        .setDescription("Blocks user from a specific task")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option => option
            .setName('block-user')
            .setDescription('User to block')
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName('block-option')
            .setDescription('Block from')
            .setRequired(true)
            .addChoices(
                { name: 'Youtube', value: 'youtube' },
                { name: 'Meme', value: 'meme' },
                { name: 'Pics Cafe', value: 'piccafe' },
                { name: 'OOC Chat', value: 'oocchat' },
                { name: 'IC Chat', value: 'icchat' },
                { name: 'Open Chat', value: 'openchat' },
            )
        )
        .addStringOption(option => option
            .setName('block-day')
            .setDescription('Blocking day')
            .setRequired(true)
            .addChoices(
                { name: '1 Day', value: '1' },
                { name: '2 Days', value: '2' },
                { name: '3 Days', value: '3' },
            )
        )
        .addBooleanOption(option => option
            .setName('block-boolean')
            .setDescription('Remove cooldown')
            .setRequired(false)
        ),

    async execute(interaction, client) {
        // Log
        const commandName = "BLOCKUSER";
        client.std_log.error(client, commandName, interaction.user.id, interaction.channel.id);

        await interaction.deferReply({ ephemeral: true });

        const user = await interaction.options.getUser("block-user");
        const events = await interaction.options.getString("block-option");
        const blockday = await interaction.options.getString("block-day");
        const removeblock = await interaction.options.getBoolean("block-boolean") || false;

        if (removeblock == true) {
            var blockUserData = await blockUserModel.findOne({
                guildId: interaction.guild.id,
                userId: user.id,
                event: events
            }).catch(err => console.log(err));
            if (blockUserData) {
                if (blockUserData.block == true) {
                    blockUserData.block = false;
                    blockUserData.expirationDate = null;
                    await blockUserData.save();
                    return await interaction.editReply({ content: 'Cooldown removed from the user', ephemeral: true });
                } else {
                    return await interaction.editReply({ content: 'The user is no cooldown', ephemeral: true });
                }
            }
        } else {

            var blockUserData = await blockUserModel.findOne({
                guildId: interaction.guild.id,
                userId: user.id,
                event: events
            }).catch(err => console.log(err));

            if (blockUserData) {
                if (blockUserData.block == true) {
                    return await interaction.editReply({ content: 'The user is already on a cooldown', ephemeral: true });
                } else {
                    blockUserData.count += 1;
                    blockUserData.block = true;
                    const expirationDate = new Date(Date.now() + parseInt(blockday) * 24 * 60 * 60 * 1000);
                    blockUserData.expirationDate = expirationDate;
                    await blockUserData.save();
                }
            } else {
                const expirationDate = new Date(Date.now() + parseInt(blockday) * 24 * 60 * 60 * 1000);
                blockUserData = new blockUserModel({
                    guildId: interaction.guild.id,
                    userId: user.id,
                    event: events,
                    block: true,
                    count: 1,
                    expirationDate: expirationDate
                });
                await blockUserData.save();
            }
            await interaction.editReply({ content: 'Cooldown added to the user!', ephemeral: true });
        }
    },
};
