const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");


module.exports = {
	name: 'ageverify',
	description: "Age verification form",
	cooldown: 20000,
	userPerms: ['Administrator'],
	botPerms: ['Administrator'],
	run: async (client, message, args) => {

		const commandName = `MESS_AGEVERIFY`;
		client.std_log.error(client, commandName, message.author.id, message.channel.id);

        const chanid = "1100398444243337356";
        await message.delete();

        const embed = new EmbedBuilder()
            .setColor('Red')
            .setDescription('```Age Verification```')

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('age-button')
                    .setEmoji('✔️')
                    .setStyle(ButtonStyle.Success),
            );

        return client.channels.cache.get(chanid).send({
            embeds: [embed],
            components: [button]
        });
	}
};