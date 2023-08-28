const {
    Events,
    WebhookClient
} = require('discord.js');

const {
    EmbedBuilder
} = require("discord.js");

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {

        if (client.config.ENABLE.DARKCHAT == false) return;
        if (message.channel.id == client.config.DARKCHAT.CHAN) {

            const webhookClient = new WebhookClient({ url: client.mod.DARKCHAT.WEBHOOK });

            if (message.author.bot) return;
            var MessageContent = message.content;
            var msg_prediction;

            await fetch(client.mod.DARKCHAT.APILINK, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ MessageContent }),
            }).then((response) => response.json())
            .then((data) => {
                msg_prediction = data.predicted_label;
            }).catch((error) => {
                msg_prediction =`Error: ${error}`;
            });

            const logEmbed = new EmbedBuilder()
                .addFields(
                    { name: 'Message', value: `\`${MessageContent}\`` },
                    { name: 'Prediction', value: `\`${msg_prediction}\`` }
                );
    
            await webhookClient.send({
                username: `Dark Chat Test`,
                embeds: [logEmbed]
            });
        }
    }
}