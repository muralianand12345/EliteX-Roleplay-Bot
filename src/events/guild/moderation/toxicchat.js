const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, } = require("discord.js");

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {

        if (client.config.ENABLE.TOXICCHAT == false) return;
        if (message.author.bot) return;

        var sentence = message.content;
        const chanID = client.mod.TOXICCHAT.CHANID;
        const chan = client.channels.cache.get(chanID);
        const embed = new EmbedBuilder()
            .setAuthor({ name: 'Text Moderation' });

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('toxicchat-timeout')
                    .setLabel('Timeout')
                    .setStyle(ButtonStyle.Primary),
                /*new ButtonBuilder()
                    .setCustomId('toxicchat-kick')
                    .setLabel('Kick')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('toxicchat-ban')
                    .setLabel('Ban')
                    .setStyle(ButtonStyle.Primary),*/
            );

        await fetch(client.mod.TOXICCHAT.APILINK, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sentence }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.toxicity >= 0.69) {
                    embed.setColor('Red')
                        .setURL(`${message.url}`)
                        //.setDescription(`**User:** <@${message.author.id}>\n**Message Content:**\n\`\`\`${message.content}\`\`\``)
                        .addFields(
                            { name: '**User:**', value: `<@${message.author.id}>` },
                            { name: '**Message Content:**', value: `\`\`\`${message.content}\`\`\`` },
                            { name: '**Message Link:**', value: `[Jump to Message](${message.url})` },
                            { name: '**--------------**', value: `***Toxicity Meter***` },
                        )
                        .setFooter({ text: `${message.author.id}` });

                    for (const [key, value] of Object.entries(data)) {
                        embed.addFields({ name: `${key}`, value: `${value.toString()}` });
                    }
                    chan.send({ embeds: [embed], components: [button] });
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    }
}