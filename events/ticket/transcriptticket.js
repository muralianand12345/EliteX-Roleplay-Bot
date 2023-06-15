const {
    Events,
} = require('discord.js');
const {
    EmbedBuilder
} = require('discord.js');

const discordTranscripts = require('discord-html-transcripts');
require("dotenv").config();
const fs = require('fs');
const ticketData = require("../../events/models/channel.js");
const ticketModel = require('../../events/models/ticket.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        if (interaction.customId == "transcript-ticket") {
            const chan = interaction.channel;

            var IdData = await ticketData.findOne({
                ticketGuildID: interaction.guild.id
            }).catch(err => console.log(err));

            const ticketDoc = await ticketModel.findOne({
                ticketID: interaction.channel.id
            }).catch(err => console.log(err));

            const htmlCode = await discordTranscripts.createTranscript(chan, {
                limit: -1,
                returnType: 'string',
                filename: `transcript-${chan.id}.html`,
                saveImages: false,
                poweredBy: false
            });

            const serverAdd = `${process.env.SERVER_IP}:${process.env.PORT}`;
            fs.writeFile(`./ticket-logs/transcript-${chan.id}.html`, htmlCode, function (err) {
                if (err) {
                    console.log(err);
                }
            });
            var userId;
            if (ticketDoc) {
                userId = ticketDoc.userID;
            } else {
                userId = "null-ticketbug";
            }

            const embed = new EmbedBuilder()
                .setAuthor({ name: 'Ticket Transcript', iconURL: client.config.EMBED.IMAGE })
                .setDescription(`📰 Logs of the ticket \`${chan.id}\` created by <@!${userId}> and logged by <@!${interaction.user.id}>\n\nLogs: [**Click here to see the logs**](http://${serverAdd}/transcript-${chan.id}.html)`)
                .setColor('#E67E22')
                .setTimestamp();

            await client.channels.cache.get(IdData.ticketLogChannelID).send({
                embeds: [embed]
            });

            const Replyembed = new EmbedBuilder().setColor('#ED4245');
            await client.users.cache.get(interaction.user.id).send({
                embeds: [embed]
            }).catch(error => {
                if (error.code == 50007) {
                    Replyembed.addFields({ name: 'Error', value: 'Unable to DM user!'});

                } else {
                    console.error(error);
                }
            }).then(() => {

                Replyembed.addFields({ name: 'Success', value: 'Ticket Logged Successfully!'});

                interaction.reply({
                    embeds: [Replyembed],
                    ephemeral: true
                });
            });
        }
    }
};