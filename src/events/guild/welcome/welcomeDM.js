const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Events
} = require("discord.js")

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {

        if (client.config.ENABLE.WELCOME === false) return;
        const guilId = client.visa.GUILDID;
        if (member.guild.id !== guilId) return;

        const userID = member.user.id;
        const userName = member.user.username;
        const userTag = member.user.discriminator;
        const formLink = client.visa.LINK;

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setThumbnail(client.visa.LOGO)
            .setTitle(`Welcome to Iconic RP`)
            .setDescription(`**<@${userID}>, we are delighted to have you among us. On behalf of Iconic RP Team, we would like to extend our warmest welcome!**`)
            .setFields(
                { name: "Step 1: Apply Form", value: `<#${client.visa.WELCOME.TAGCHAN}>` },
                { name: "Step 2: Wait For The Reply", value: `<#${client.visa.WELCOME.REPLY}>` },
                { name: "Step 3: Attend The VP", value: `<#${client.visa.WELCOME.VPVOICE}>` },
            )

        const sbutton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel(`Apply Here`)
                    .setEmoji('📲')
                    .setStyle(ButtonStyle.Link)
                    .setURL(formLink)
            )

        var bool = 0;
        await client.users.cache.get(userID).send({
            embeds: [embed],
            components: [sbutton]
        }).catch(error => {
            if (error.code == 50007) {
                bool = 1;
            }
        });

        if (bool == 1) {
            const logembederr = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription(`Unable to DM <@${userID}> \`${userName}#${userTag}\` (Apply Form)`)

            return client.channels.cache.get(client.visa.WELCOME.LOGCHAN).send({
                embeds: [logembederr]
            });

        } else if (bool == 0) {
            const logembed = new EmbedBuilder()
                .setColor('#000000')
                .setDescription(`DM sent to <@${userID}> \`${userName}#${userTag}\` (Apply Form)`)

            return client.channels.cache.get(client.visa.WELCOME.LOGCHAN).send({
                embeds: [logembed]
            });

        } else {
            return;
        }
    }
};