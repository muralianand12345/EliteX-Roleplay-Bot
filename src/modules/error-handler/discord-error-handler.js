const Discord = require("discord.js")

class handling {
    constructor(client, options = {}) {
        this.client = client;
        this.webhook = (options.webhook ? new Discord.WebhookClient(options.webhook) : false);
        this.stats = options.stats || false;
        if (!this.client) throw new Error('Discord client is missing or not specified.');
        if (!this.webhook) throw new Error('Webhook token or ID is missing or not specified.');
        this.client.error = new Map();
    }
    /**
    * @param {object} [client]
    * @param {string} [guildId]
    * @param {string} [msg]
    * @param {string} [errorr] 
    */

    async createrr(client, guildId, msg, errorr) {
        if (!client) throw new TypeError("An client was not provided.");
        if (!errorr) throw new TypeError("An errorr was not provided.");
        if (!this.webhook) throw new TypeError("You did not added a webhook id or a token in the options");
        const clean = text => {
            text = String(text);
            let searched = text.split('\n');
            return searched[0];
        }
        let cleaned = clean(errorr);
        if (client.error.has(cleaned)) {
            client.error.set(cleaned, {
                guildid: guildId,
                msg: msg,
                stack: errorr.stack,
                error: cleaned,
                count: client.error.get(cleaned).count + 1,
                date: Date.now(),
                msgid: client.error.get(cleaned).msgid,
                channelid: client.error.get(cleaned).channelid,

            });

        } else {
            if (client.error.has("allerrors")) {
                let allerrors = client.error.get("allerrors").allerrors
                allerrors.push(cleaned)
                client.error.set("allerrors", {
                    allerrors: allerrors,
                })
            } else {
                client.error.set("allerrors", {
                    allerrors: [cleaned],
                })
            }

            let log = new Discord.EmbedBuilder();
            log.setTitle("New Error Entcounterd!")
            if (msg) {
                log.addFields({ name: `On message in ${guildId}:`, value: "```" + msg + "```" })
            }
            log.addFields({ name: "Error", value: "```" + smaller(errorr.stack, 800) + "```" })
            log.setColor('Red')
            log.setTimestamp();

            const servermessage = await this.webhook.send({ embeds: [log] });
            console.log(errorr)
            client.error.set(cleaned, {
                guildid: guildId,
                msg: msg,
                error: cleaned,
                count: 1,
                stack: errorr.stack,
                date: Date.now(),
                msgid: servermessage.id,
                channelid: servermessage.channel_id,
            });
        }
        return;
    }
    /**
    * @param {object} [message]
    * @param {object} [client]
    */
    async report(client, message) {
        try {
            if (!message || !client) throw new TypeError("A client or message was not provided.");
    
            const allErrors = client.error.get("allerrors");
            if (!allErrors) {
                message.channel.send("No Errors have been found!");
                return;
            }
    
            const allErrorInfo = allErrors.allerrors.map(errorKey => {
                const errorInfo = client.error.get(errorKey);
                return `**[${errorInfo.error}](https://discord.com/channels/${message.guild.id}/${errorInfo.channelid}/${errorInfo.msgid})** - **${errorInfo.count}**`;
            });
    
            const report = new Discord.EmbedBuilder()
                .setTitle("Error Message - Count")
                .setDescription(`\`\`\`${allErrors.allerrors.length} Errors happened ${allErrorInfo.length} times\`\`\`\n${smaller(allErrorInfo.join("\n"), 1800)}`)
                .setFooter({ text: "Requested by: " + message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setTimestamp()
                .setColor('Yellow');
    
            message.channel.send({ embeds: [report] });
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = handling;

function smaller(string, limit) {
    if (string.length <= limit) {
        return string;
    }
    return string.slice(0, limit) + '...';
}