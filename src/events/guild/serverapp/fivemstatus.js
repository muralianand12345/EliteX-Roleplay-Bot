const { Events, EmbedBuilder, WebhookClient } = require('discord.js');
const cfx = require('cfx-api');
require("dotenv").config();

module.exports = {
    name: Events.ClientReady,
    async execute(client) {
        let embedMessage;
        const Web = process.env.FIVEMWEB;
        const webhookClient = new WebhookClient({ url: Web });
        async function updateEmbed() {
            try {
                const status = await cfx.fetchStatus();
                if (!status) return;

                const embed = new EmbedBuilder()
                    .setAuthor({ name: 'Iconic RP', iconURL: 'https://cdn.discordapp.com/attachments/1099720199588040824/1099784792821743686/ic_logo.png', url: 'https://discord.gg/iconicrp' })
                    .setThumbnail('https://cdn.discordapp.com/attachments/1113031312513708073/1122174543600042064/11abac85b780a6bfb422bb414511bacab31e72a7.png')
                    .setFooter({ text: 'Updates Every 10 Seconds', iconURL: 'https://cdn.discordapp.com/attachments/1099720199588040824/1099784792821743686/ic_logo.png' });

                if (!status.everythingOk) {
                    embed.setTitle('CFX.re Status: Down');
                    embed.setURL('https://status.cfx.re');
                    embed.setColor('Red');
                    embed.setDescription('\`\`\`The CFX.re Systems Are Currently Experiencing Issues.\`\`\`\n**--------------------**');
                    embed.setTimestamp();

                    const components = await status.fetchComponents();
                    if (!components) return;
                    for (let component of components) {
                        if (component.status !== 'operational') {
                            embed.addFields({ name: `${component.name}`, value: `\`\`\`${component.status}\`\`\`` });
                        }
                    }
                } else {
                    embed.setTitle('CFX.re Status: Up');
                    embed.setURL('https://status.cfx.re');
                    embed.setColor('Green');
                    embed.setDescription('\`\`\`All CFX.re Systems Are Operational.\`\`\`');
                    embed.setTimestamp();
                }

                if (embedMessage) {
                    embedMessage.edit({ embeds: [embed] });
                } else {
                    const channel = client.channels.cache.get(client.config.CFX.CHAN);
                    if (channel) {
                        const messages = await channel.messages.fetch({ limit: 1 });
                        if (messages.size > 0) {
                            await messages.first().delete().then(async () => {
                                embedMessage = await channel.send({ embeds: [embed] });
                            }).catch((error) => {
                                console.error('Error deleting message:', error);
                            });
                        }

                    } else {
                        console.error('No Channel Find | CFX.re Status')
                    }
                }
                
            } catch (err) {
                await webhookClient.send({
                    content: `\`\`\`${err}\`\`\``,
                    username: 'FiveM API',
                    avatarURL: "https://www.setra.com/hubfs/Sajni/crc_error.jpg",
                });
            }
        }

        updateEmbed();
        setInterval(updateEmbed, 10000);
    }
}
