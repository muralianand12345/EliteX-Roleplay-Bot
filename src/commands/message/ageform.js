const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
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

        const chanid = client.immigration.AGE.CHANID;
        await message.delete();

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setDescription('Please confirm you have read the below message by clicking the "Verify" button and proceed to the **Age Verification Section**!')
            .setImage('https://cdn.discordapp.com/attachments/1099720199588040824/1103239895423647784/DISCLAIMER_copy.jpg');
        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('age-category')
                    .setPlaceholder('Select Your Age!')
                    .addOptions([
                        {
                            label: 'Above 18',
                            value: 'above-18',
                            emoji: '👨',
                        },
                        {
                            label: 'Below 18',
                            value: 'below-18',
                            emoji: '👶',
                        }
                    ]),
            );

        return client.channels.cache.get(chanid).send({
            embeds: [embed],
            components: [row]
        });
    }
};