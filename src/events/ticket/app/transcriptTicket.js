const { Events, EmbedBuilder } = require('discord.js');
const discordTranscripts = require('discord-html-transcripts');
require("dotenv").config();
const fs = require('fs');
const path = require('path');

const ticketGuildModel = require('../../database/modals/ticketGuild.js');
const ticketUserModel = require('../../database/modals/ticketUser.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        if (!interaction.isButton()) return;

        if (interaction.customId == "transcript-ticket") {

            await interaction.deferReply();

            const chan = interaction.channel;

            var ticketGuild = await ticketGuildModel.findOne({
                guildID: interaction.guild.id
            }).catch(err => client.logger.error(err));

            var ticketUser = await ticketUserModel.findOne({
                userID: interaction.user.id
            }).catch(err => client.logger.error(err));

            if (!ticketGuild || !ticketUser) {
                return await interaction.editReply({ content: `Error: No data found, contact the Developer.`, ephemeral: true });
            }

            const htmlCode = await discordTranscripts.createTranscript(chan, {
                limit: -1,
                returnType: 'string',
                filename: `transcript-${chan.id}.html`,
                saveImages: false,
                poweredBy: false
            });

            const ticketLogDir = path.join(__dirname, '../../website/ticket-logs');
            const serverAdd = `${process.env.SERVERADD}`;

            fs.writeFile(`${ticketLogDir}/transcript-${chan.id}.html`, htmlCode, function (err) {
                if (err) {
                    client.logger.error(err);
                }
            });

            var userId;
            if (ticketUser) {
                userId = ticketUser.userID;
            }

            const embed = new EmbedBuilder()
                .setAuthor({ name: 'Ticket Transcript', iconURL: client.user.avatarURL() })
                .setDescription(`📰 Logs of the ticket \`${chan.id}\` created by <@!${userId}> and logged by <@!${interaction.user.id}>\n\nLogs: [**Click here to see the logs**](${serverAdd}/transcript-${chan.id}.html)`)
                .setColor('#E67E22')
                .setTimestamp();

            await client.channels.cache.get(ticketGuild.ticketLogID).send({
                embeds: [embed]
            });

            await client.users.cache.get(interaction.user.id).send({
                embeds: [embed]
            }).catch(error => {
                if (error.code == 50007) {
                    client.logger.error(`User: ${interaction.user.id} has disabled DMs. | Ticket [${chan.id}] Transcript: ${serverAdd}/transcript-${chan.id}.html`);
                } else {
                    client.logger.error(error);
                }
            }).then(() => {
                interaction.editReply({ content: `Transcript has been sent to your DMs!` });
            })
        }

    }
}