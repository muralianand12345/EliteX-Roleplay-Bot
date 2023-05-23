const ticketModel = require('../../events/models/ticket.js');

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

        if (ticketDoc) {

            await ticketDoc.deleteOne().then(async()=>{
                message.channel.send({content: 'Ticket channel data has been removed/deleted!'})
            }).catch(err=>{
                message.channel.send({ content: 'Error deleting data | Manual removal required!'})
            });

        } else if (!ticketDoc) {
            message.channel.send({ content: 'No Ticket Found in Database!'})
        }
        await message.delete();
	}
};