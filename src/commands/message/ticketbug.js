const ticketModel = require('../../events/mongodb/modals/ticket.js');

const { ticketBugEmbed } = require('../../events/ticket/app/functions/ticketEmbed.js');

module.exports = {
    name: 'ticketbug',
    description: "Clears the channel bugs",
    cooldown: 1000,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    run: async (client, message, args) => {

        const commandName = `MESS_TICKETBUG`;
        client.std_log.error(client, commandName, message.author.id, message.channel.id);

        var ticketDoc = await ticketModel.findOne({
            ticketData: {
                $elemMatch: {
                    ticketID: message.channel.id
                }
            }
        }).catch(err => console.log(err));

        //Old Ticket
        if (!ticketDoc) {
            ticketDoc = await ticketModel.findOne({
                ticketID: message.channel.id
            }).catch(err => console.log(err));
        }

        await ticketBugEmbed(client, message, ticketDoc);
    }
};