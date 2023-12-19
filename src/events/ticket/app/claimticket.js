const {
    Events,
} = require('discord.js');

const ticketGuild = require('../../database/modals/ticketGuild.js');
const { claimTicketEmbed } = require('./functions/ticketEmbed.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (interaction.customId == "claim-ticket") {
            var ticketData = await ticketGuild.findOne({
                guildID: interaction.guild.id
            }).catch(err => client.logger.error(err));
            if (!interaction.member.roles.cache.has(ticketData.ticketSupportID)) return interaction.reply({ content: 'Tickets can only be claimed by \'Ticket Supporters\'', ephemeral: true });
            await claimTicketEmbed(client, interaction);
        }
    }
}