const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

module.exports = {
    cooldown: 10000,

    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('About the Bot <3')
        .setDMPermission(true),
    async execute(interaction, client) {

        const discordpackage = require("discord.js").version;

        //log
        const commandName = "BOTINFO";
        var chanID;
        if (interaction.channel == null) {
            chanID = "DM";
        } else {
            chanID = interaction.channel.id;
        }
        client.std_log.error(client, commandName, interaction.user.id, chanID);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel("Iconic Roleplay")
                    .setStyle(ButtonStyle.Link)
                    .setURL("https://discord.gg/8pEzKpqFgK")
            );

        let days = Math.floor(client.uptime / 86400000);
        let hours = Math.floor(client.uptime / 3600000) % 24;
        let minutes = Math.floor(client.uptime / 60000) % 60;
        let seconds = Math.floor(client.uptime / 1000) % 60;

        let ram = ((process.memoryUsage().heapUsed / 1024 / 1024) + (process.memoryUsage().heapTotal / 1024 / 1024)).toFixed(2);

        const embed = new EmbedBuilder()
            .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() })
            .setColor('#3498DB')
            .addFields(
                {
                    name: 'API latency',
                    value: `\`\`\`${client.ws.ping} ms\`\`\``,
                    inline: true,
                },
                {
                    name: 'Users',
                    value: `\`\`\`${client.users.cache.size}\`\`\``,
                    inline: true,
                },
                {
                    name: 'Servers',
                    value: `\`\`\`${client.guilds.cache.size}\`\`\``,
                    inline: true,
                },
                {
                    name: 'RAM Usage',
                    value: `\`\`\`${ram}MB\`\`\``,
                    inline: true,
                },
                {
                    name: 'Server OS',
                    value: `\`\`\`Linux\`\`\``,
                    inline: true,
                },
                {
                    name: 'Discord',
                    value: `\`\`\`DiscordJS ${discordpackage}\`\`\``,
                    inline: true,
                },
                {
                    name: 'Uptime',
                    value: `\`\`\`${days}d ${hours}h ${minutes}m ${seconds}s\`\`\``,
                    inline: true,
                },
                {
                    name: 'Developers',
                    value: `\`\`\`Murali Anand\`\`\``,
                    inline: false,
                },

            )
            .setTimestamp()
            .setFooter({ text: client.config.EMBED.FOOTTEXT, iconURL: client.user.avatarURL() })

        interaction.reply({ embeds: [embed], components: [row] });

    },
};