const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const Gamedig = require('gamedig');

module.exports = {
    name: 'fivem',
    description: "FiveM Test Command",
    cooldown: 20000,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    run: async (client, message, args) => {


        let serverStatus = {
            serverIP: '00.00.00.00', 
            serverPort: 1000,
            players: null,
            maxPlayers: null, 
            ping: null 
        };

        Gamedig.query({
            type: 'fivem',
            host: serverStatus.serverIP,
            port: serverStatus.serverPort,
        }).then((server) => {
            if (!serverStatus.players) {
                console.log('No Players');
            }

            serverStatus.players = server.players.length;
            serverStatus.maxPlayers = server.maxplayers;
            serverStatus.ping = server.ping;

            console.log(serverStatus)
        });
    }
}