const {
    EmbedBuilder, 
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle
} = require("discord.js");

module.exports = {
    name: 'cembed',
    description: "Sends user DM reply",
    cooldown: 1000,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    run: async (client, message, args) => {

        const commandName = `MESS_CUSTOM_EMBED`;
        client.std_log.error(client, commandName, message.author.id, message.channel.id);

        var User = args[0];
        var Message = args.slice(1).join(" ");

        message.delete()

        const embed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('Auction Registration')
        .setDescription('`Thank you for your interest in participating in our auction! To proceed with your registration, please click the button below.`');
        const embed2 = new EmbedBuilder()
        .setColor('Blue')
        .addFields(
            { name: 'Vehicle Dealership | 2 Owner', value: 'A good opportunity to sell all new cars and bikes in the city. Be well known and run a cool dealership to sell the machines.'},
            { name: 'Logistics Company | 2 Owner', value: 'Transport the city requirement and sail through the roads of our city. Empower the road transport by owning these companies.'},
            { name: 'Mechanics and Customs | 2 Owner', value: "Be a pro at resolving mechanical issues for machine and enhancing your creativity with new colours and spare parts."},
            { name: 'Bottle Factory | 1 Owner', value: 'Own a company that is pioneer in the bottle manufacturing industry and will be used for different local requirements.'},
            { name: 'Hazard Factory | 1 Owner', value: 'Own the city\'s sole hazard facility and production unit which helps in the city environment control and development of green gases.'},
            { name: 'Food Business | 2 Owner', value: 'Start a food supply chain and feed the hungry.'},
            { name: 'Oil Rig | 2 Owner', value: 'Begin plumbing the soil and locating renewable energy sources to fill the hungry machine.'},
            { name: 'Fuel Station Zones | 2 Owner', value: 'Control the various zones of the city and maintain the fuel station throughout everyday.'},
            { name: 'Real Estate | 1 Owner', value: 'Caravan, storage and garage slots as of now. Houses will be given in the future.'}
            )

        const button = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId('apply-auction')
            .setLabel('APPLY')
            .setStyle(ButtonStyle.Success)
        )

        await message.channel.send({ 
            embeds: [embed, embed2],
            components: [button]
        });
    }
};