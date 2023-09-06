const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');

const discordTranscripts = require('discord-html-transcripts');
require("dotenv").config();
const fs = require('fs');
const path = require('path');
const ticketData = require("../../events/mongodb/modals/channel.js");
const ticketModel = require('../../events/mongodb/modals/ticket.js');

module.exports = {
    cooldown: 2000,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],

    data: new SlashCommandBuilder()
        .setName('ticketbackup')
        .setDescription('Gets a manual ticket backup')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addBooleanOption(option =>
            option.setName('dm')
                .setDescription('Send copy to the user?')
                .setRequired(false)),

    async execute(interaction, client) {

        var IdData = await ticketData.findOne({
            ticketGuildID: interaction.guild.id
        }).catch(err => console.log(err));

        //log
        const commandName = "TICKETBACKUP";
        client.std_log.error(client, commandName, interaction.user.id, interaction.channel.id);

        const dmOption = interaction.options.getBoolean('dm') || false;
        const chan = interaction.channel;
        if (chan.name.includes('ticket')) {

            var ticketDoc = await ticketModel.findOne({
                ticketData: {
                    $elemMatch: {
                        ticketID: interaction.channel.id
                    }
                }
            }).catch(err => console.log(err));

            //Old Ticket
            if (!ticketDoc) {
                ticketDoc = await ticketModel.findOne({
                    ticketID: interaction.channel.id
                }).catch(err => console.log(err));
                if (!ticketDoc) return interaction.reply('Ticket is not in database!');
            }

            const htmlCode = await discordTranscripts.createTranscript(chan, {
                limit: -1,
                returnType: 'string',
                filename: `transcript-${chan.id}.html`,
                saveImages: false,
                poweredBy: false
            });

            const serverAdd = `${process.env.SERVERADD}`;

            const ticketLogDir = path.join(__dirname, '../../events/ticket/website/ticket-logs');
            fs.writeFile(`${ticketLogDir}/transcript-${chan.id}.html`, htmlCode, function (err) {
                if (err) {
                    console.log(err);
                }
            });

            const embed = new EmbedBuilder()
                .setAuthor({ name: 'Manual Log Ticket', iconURL: client.config.EMBED.IMAGE })
                .setDescription(`📰 Logs of the ticket \`${chan.id}\` created by <@!${ticketDoc.userID}> and logged by <@!${interaction.user.id}>\n\nLogs: [**Click here to see the logs**](${serverAdd}/transcript-${chan.id}.html)`)
                .setColor('#ED4245')
                .setTimestamp();

            client.channels.cache.get(IdData.ticketLogChannelID).send({
                embeds: [embed]
            });

            const commUser = interaction.user.id;

            client.users.cache.get(commUser).send({
                embeds: [embed]
            }).catch(error => {
                if (error.code == 50007) {
                    const logembed = new EmbedBuilder()
                        .setColor('#000000')
                        .setDescription(`Unable to DM User: <@${commUser}>\n\`Ticket No: ${chan.id}\``);

                    return errorSend.send({
                        embeds: [logembed]
                    });
                }
            });

            if (dmOption == true) {
                client.users.cache.get(ticketDoc.userID).send({
                    embeds: [embed]
                }).catch(error => {
                    if (error.code == 50007) {
                        const logembed = new EmbedBuilder()
                            .setColor('#000000')
                            .setDescription(`Unable to DM User: <@${ticketDoc.userID}>\n\`Ticket No: ${chan.id}\``);

                        return errorSend.send({
                            embeds: [logembed]
                        });
                    }
                });
            }

            const ReplyEmbed = new EmbedBuilder()
                .setColor("#57F287")
                .setDescription('Ticket has been logged successfully');

            await interaction.reply({
                embeds: [ReplyEmbed],
                ephemeral: true
            });

        } else {
            const ReplyEmbed = new EmbedBuilder()
                .setColor("#ED4245")
                .setDescription('You are not in a Ticket!');

            await interaction.reply({
                embeds: [ReplyEmbed],
                ephemeral: true
            });
        }
    },
};