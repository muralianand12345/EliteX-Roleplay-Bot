const {
    SlashCommandBuilder,
    EmbedBuilder,
    ChannelType,
    PermissionFlagsBits
} = require('discord.js');
const wait = require('util').promisify(setTimeout);

module.exports = {
    cooldown: 10000,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],

    data: new SlashCommandBuilder()
        .setName('restart')
        .setDescription('Sends 144 Alert Message')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('now')
                .setDescription('Server Restart in 5 Minutes!'),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('done')
                .setDescription('Server is Back online!'),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('maintenance')
                .setDescription('Server Under Going Maintenance'),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('no')
                .setDescription('No Restart'),
        ),

    async execute(interaction, client) {

        const commandName = "RESTART";
        client.std_log.error(client, commandName, interaction.user.id, interaction.channel.id);

        const alertChan = client.channels.cache.get(client.config.RESTART.CHAN);
        const tag = client.config.RESTART.VISAROLE;

        const restartEmbed = new EmbedBuilder()

        if (interaction.options.getSubcommand() === "now") {
            restartEmbed.setColor('#FFA500').setDescription(`Quick Server Restart In 5 Minutes! <@&${tag}>`)
        }

        if (interaction.options.getSubcommand() === "done") {
            restartEmbed.setColor('#00FF00').setDescription(`Server Is Back Online. Enjoy Your Roleplay! <@&${tag}>`)
        }

        if (interaction.options.getSubcommand() === "maintenance") {
            restartEmbed.setColor('#FF0000').setDescription(`Tsunami Alert! Server Will Be Under Going Maintenance In Few Minutes. Do Not Enter Until Further Announcements. <@&${tag}>`)
        }

        if (interaction.options.getSubcommand() === "no") {
            restartEmbed.setColor('#FFA500').setDescription(`Quick Server Restart In 5 Minutes! <@&${tag}>`)
        }

        await alertChan.send({
            embeds: [restartEmbed]
        }).then(() => {
            interaction.reply({ content: 'Successfully Sent!', ephemeral: true});
        })
    }
};