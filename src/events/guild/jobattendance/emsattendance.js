const {
    Events,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {

        if (message.channel.id !== "1110271539460456539") return;
        if (!message.author.bot) return;

        const attEmbed = message.embeds[0];
        if (!attEmbed) return;

        console.log(attEmbed)

        const attEmbedDesc = attEmbed.description;
        const nameRegex = /Name:\s*\*\*(.*?)\*\*/;
        const durationRegex = /Shift duration:\s*\*\*__(.*?)__\*\*/;

        const nameMatch = attEmbedDesc.match(nameRegex);
        const durationMatch = attEmbedDesc.match(durationRegex);
        const name = nameMatch ? nameMatch[1] : null;
        const duration = durationMatch ? durationMatch[1] : null;
        if (!name || !duration) return;

        const regex = /(\w+\s+\w+)\s+(\d+)\s+(seconds|minutes|hours),?\s*(\d+\.?\d*)?/g;

        var inputText = name + ' ' + duration;

        let match;
        while ((match = regex.exec(inputText)) !== null) {
            const name = match[1];
            const unit = match[3];
            const value = parseFloat(match[2]) + (match[4] ? parseFloat(match[4]) : 0);

            let durationInMinutes;

            if (unit === 'seconds') {
                durationInMinutes = value / 60;
            } else if (unit === 'hours') {
                durationInMinutes = value * 60;
            } else {
                durationInMinutes = value;
            }
            console.log(name, durationInMinutes, 'minutes');
        }
    }
}