const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const ticketModel = require('../../events/mongodb/modals/ticket.js');

module.exports = {
    name: 'ticketbug',
    description: "Clears the channel bugs",
    cooldown: 1000,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    run: async (client, message, args) => {

        const commandName = `MESS_TICKETBUG`;
        client.std_log.error(client, commandName, message.author.id, message.channel.id);

        const ticketDoc = await ticketModel.findOne({
            ticketID: message.channel.id
        }).catch(err => console.log(err));
        
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('close-ticket')
                    .setLabel('Close Ticket')
                    .setEmoji('899745362137477181')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('transcript-ticket')
                    .setLabel('Transcript')
                    .setEmoji('📜')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('claim-ticket')
                    .setLabel('Claim')
                    .setEmoji('🔒')
                    .setStyle(ButtonStyle.Secondary),
            );

        /*if (ticketDoc) {
            message.channel.send({ content: 'No Ticket Found in Database! / Manual delete needed' });
            await ticketDoc.deleteOne().then(async () => {
                message.channel.send({ content: 'Ticket channel data has been removed/deleted!' })
            }).catch(err => {
                message.channel.send({ content: 'Error deleting data | Manual removal required!' })
            });

        } */
        if (!ticketDoc) {
            row.components[0].setDisabled(true);
            message.channel.send({ content: 'No Ticket Found in Database! / Manual delete needed' });
        }
        await message.delete();

        const embed = new EmbedBuilder()
            .setColor('#206694')
            .setAuthor({ name: 'Ticket', iconURL: client.config.EMBED.IMAGE })
            .setDescription(`**Created a ticket**`)
            .setFooter({ text: client.config.EMBED.FOOTTEXT, iconURL: client.config.EMBED.IMAGE })
            .setTimestamp();
        
        const chan = message.channel;
        return await chan.send({ embeds: [embed], components: [row] });
    }
};