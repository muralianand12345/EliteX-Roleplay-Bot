const {
    Events,
} = require('discord.js');

const ticketData = require("../../../events/mongodb/modals/channel.js");
const { claimTicketEmbed } = require('./functions/ticketEmbed.js')

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        if (interaction.customId == "claim-ticket") {

            var IdData = await ticketData.findOne({
                ticketGuildID: interaction.guild.id
            }).catch(err => console.log(err));

            if (!interaction.member.roles.cache.has(IdData.ticketSupportID)) return interaction.reply({ content: 'Tickets can only be claimed by \'Ticket Supporters\'', ephemeral: true });

            await claimTicketEmbed(client, interaction);
        }
    }
}