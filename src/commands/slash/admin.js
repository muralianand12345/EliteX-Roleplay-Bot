const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {
    cooldown: 10000,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],

    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Admin Message Command')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)

        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Ban a user')
                .addUserOption(option => option
                    .setName('ban-user')
                    .setDescription('User to ban')
                    .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('ban-reason')
                        .setDescription('Ban Reason')
                        .setRequired(true))
                .addBooleanOption(option => option
                    .setName('ban-dm')
                    .setDescription('DM the user about the ban')
                    .setRequired(false)
                )
                .addBooleanOption(option => option
                    .setName('ban-sever')
                    .setDescription('Ban the user from discord server')
                    .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('warn')
                .setDescription('Warn a user')
                .addUserOption(option => option
                    .setName('warn-user')
                    .setDescription('User to warn')
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName('warn-reason')
                    .setDescription('Warn Reason')
                    .setRequired(true)
                )
                .addBooleanOption(option => option
                    .setName('warn-dm')
                    .setDescription('DM the user about the warn')
                    .setRequired(false)
                )
        ),

    async execute(interaction, client) {

        //log
        const commandName = "ADMIN";
        client.std_log.error(client, commandName, interaction.user.id, interaction.channel.id);

        var embed;
        
        switch (interaction.options.getSubcommand()) {
            case "ban":
                const banUser = await interaction.options.getMember("ban-user");
                const banReason = await interaction.options.getString("ban-reason");
                const banDM = await interaction.options.getBoolean("ban-dm") || false;
                const banServer = await interaction.options.getBoolean("ban-sever") || false;

                if (banUser.id == interaction.user.id) return interaction.reply({ content: "You can't ban yourself", ephemeral: true });
                if (banUser.id == client.user.id) return interaction.reply({ content: "You can't ban me", ephemeral: true });
                if (banUser.bot) return interaction.reply({ content: "You can't ban a bot", ephemeral: true });

                await interaction.deferReply({ ephemeral: true });

                const banChannel = client.channels.cache.get(client.mod.ADMIN.BAN.CHANID);

                embed = new EmbedBuilder()
                    .setColor('Red')
                    .setDescription(`User: <@${banUser.id}>\n**Reason:** ${banReason}`)
                    .setTimestamp();

                if (banServer == true) {
                    if (banUser.bannable == false) return await interaction.editReply({ content: "I can't ban this user", ephemeral: true });
                    embed.setAuthor({ name: "Permanent Ban", iconURL: `${client.user.displayAvatarURL()}` })
                    banUser.ban({ reason: banReason });
                } else {
                    embed.setAuthor({ name: "Temporary Ban", iconURL: `${client.user.displayAvatarURL()}` })
                }

                if (banDM == true) {
                    await banUser.send({ embeds: [embed] });
                }
                await banChannel.send({ embeds: [embed] });

                await interaction.editReply({ content: `User banned: ${banUser.user.tag}`, ephemeral: true });
                break;

            case "warn":

                const warnUser = await interaction.options.getUser("warn-user");
                const warnReason = await interaction.options.getString("warn-reason");
                const warnDM = await interaction.options.getBoolean("warn-dm") || false;

                if (warnUser.id == interaction.user.id) return interaction.reply({ content: "You can't warn yourself", ephemeral: true });
                if (warnUser.id == client.user.id) return interaction.reply({ content: "You can't warn me", ephemeral: true });
                if (warnUser.bot) return interaction.reply({ content: "You can't warn a bot", ephemeral: true });

                const warnChannel = client.channels.cache.get(client.mod.ADMIN.WARN.CHANID);

                embed = new EmbedBuilder()
                    .setColor('Orange')
                    .setDescription(`User: <@${warnUser.id}>\n**Reason:** ${warnReason}`)
                    .setTimestamp()
                    .setAuthor({ name: "Warning", iconURL: `${client.user.displayAvatarURL()}` });

                if (warnDM == true) {
                    await warnUser.send({ embeds: [embed] });
                }
                await warnChannel.send({ embeds: [embed] });

                interaction.reply({ content: `User warned: ${warnUser.tag}`, ephemeral: true });
                break;
        }
    },
};