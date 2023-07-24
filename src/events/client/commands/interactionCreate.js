const {
    Events,
    EmbedBuilder,
    Collection,
    PermissionsBitField,
    InteractionType
} = require('discord.js');
const cooldown = new Collection();
const ms = require('ms');

module.exports = {
    name: Events.InteractionCreate,
    execute: async (interaction, client) => {

        if (!interaction) return console.error('No interaction!');
        if (!interaction.type === InteractionType.ApplicationCommand) return;
        //if (!interaction.member || !interaction.guild) return console.error('No User or Guild found!');
        const command = client.slashCommands.get(interaction.commandName);
        if (!command) return;

        try {
            if (command) {
                if (command.cooldown) {
                    if (cooldown.has(`${command.name}${interaction.user.id}`)) {
                        var coolMsg = client.config.MESSAGE["COOLDOWN_MESSAGE"].replace('<duration>', ms(cooldown.get(`${command.name}${interaction.user.id}`) - Date.now(), { long: true }));
                        const coolEmbed = new EmbedBuilder()
                            .setDescription(`${coolMsg}`)
                            .setColor('#ED4245')
                        return interaction.reply({ embeds: [coolEmbed], ephemeral: true });
                    }
                    if (interaction.guild != null) {
                        if (command.userPerms || command.botPerms) {
                            if (!interaction.member.permissions.has(PermissionsBitField.resolve(command.userPerms || []))) {
                                const userPerms = new EmbedBuilder()
                                    .setDescription(`🚫 <@${interaction.user.id}>, You don't have \`${command.userPerms}\` permissions to use this command!`)
                                    .setColor('#ED4245')
                                return interaction.reply({ embeds: [userPerms], ephemeral: true });
                            }
                            if (!interaction.guild.members.cache.get(client.user.id).permissions.has(PermissionsBitField.resolve(command.botPerms || []))) {
                                const botPerms = new EmbedBuilder()
                                    .setDescription(`🚫 <@${interaction.user.id}>, I don't have \`${command.botPerms}\` permissions to use this command!`)
                                    .setColor('#ED4245')
                                return interaction.reply({ embeds: [botPerms], ephemeral: true });
                            }
                        }
                    } else {
                        if (command.userPerms || command.botPerms) {
                            return;
                        }
                    }
                    config = client.config;
                    await command.execute(interaction, client, config);
                    cooldown.set(`${command.name}${interaction.user.id}`, Date.now() + command.cooldown)
                    setTimeout(() => {
                        cooldown.delete(`${command.name}${interaction.user.id}`)
                    }, command.cooldown);
                } else {
                    if (command.userPerms || command.botPerms) {
                        if (!interaction.member.permissions.has(PermissionsBitField.resolve(command.userPerms || []))) {
                            const userPerms = new EmbedBuilder()
                                .setDescription(`🚫 <@${interaction.user.id}>, You don't have \`${command.userPerms}\` permissions to use this command!`)
                                .setColor('#ED4245')
                            return interaction.reply({ embeds: [userPerms], ephemeral: true });
                        }
                        if (!interaction.guild.members.cache.get(client.user.id).permissions.has(PermissionsBitField.resolve(command.botPerms || []))) {
                            const botPerms = new EmbedBuilder()
                                .setDescription(`🚫 <@${interaction.user.id}>, I don't have \`${command.botPerms}\` permissions to use this command!`)
                                .setColor('#ED4245')
                            return interaction.reply({ embeds: [botPerms], ephemeral: true });
                        }
                    }
                    config = client.config;
                    await command.execute(interaction, client, config);
                }
            }
        } catch (error) {
            global.console.log(error);
            const botErrorEmbed = new EmbedBuilder()
                .setColor('#ED4245')
                .setDescription('An internal error occurred. Please contact the bot developers.');
            return interaction.reply({ embeds: [botErrorEmbed], ephemeral: true });
        }
    }
}