const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");


module.exports = {
    name: 'vpform',
    description: "Voice Process Form",
    cooldown: 20000,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    run: async (client, message, args) => {

        const commandName = `MESS_VPFORM`;
        client.std_log.error(client, commandName, message.author.id, message.channel.id);

        const chanid = "1098953374692540426";
        await message.delete();

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setThumbnail('https://cdn.discordapp.com/attachments/1099720199588040824/1099784792821743686/ic_logo.png')
            .setTitle('ICONIC Roleplay Voice Process')
            .setDescription(`Kindly read the server rules before applying for **Voice Process** <#1097101873783242844>`)
            .setFooter({ text: 'Please wait 48 Hours to get result after you apply.', iconURL: 'https://cdn.discordapp.com/attachments/1099720199588040824/1099784792821743686/ic_logo.png' });

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('vp-button')
                    .setLabel('Apply Here')
                    .setEmoji('📄')
                    .setStyle(ButtonStyle.Success),
            );

        return client.channels.cache.get(chanid).send({
            embeds: [embed],
            components: [button]
        });
    }
};