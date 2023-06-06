const {
    EmbedBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ButtonBuilder
} = require("discord.js");

const vpModel = require('../../events/models/vpcount.js');

module.exports = {
    name: 'visaaccept',
    description: "Sends user DM reply",
    cooldown: 1000,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    run: async (client, message, args) => {

        const commandName = `MESS_VISAACCEPT`;
        client.std_log.error(client, commandName, message.author.id, message.channel.id);

        var vpDoc = await vpModel.findOne({
            guildID: message.guild.id
        }).catch(err => console.log(err));

        if (!vpDoc) {
            vpDoc = new vpModel({
                guildID: message.guild.id,
                vpCount: 0
            });
            await vpDoc.save();
        }

        const VPChan = client.visa.ACCEPTED.VPCHAN;
        const chan = client.channels.cache.get(VPChan);

        if (message.content.includes('<@')) {
            var mention = message.mentions.users.first();
            await message.delete();

            if (mention == null) {
                return;
            } else {
                vpDoc.vpCount += 1;
                await vpDoc.save();

                const mentionID = mention.id;
                
                const msg = await chan.send(`${vpDoc.vpCount}. <@${mentionID}> Thank you for taking your time to fill out the Iconic RP form, Please attend the voice process to take this forward!`);
                var msgLink = msg.url;

                const embed = new EmbedBuilder()
                    .setColor('Green')
                    .setThumbnail(client.visa.LOGO)
                    .setTitle(`${client.visa.NAME}`)
                    .setDescription(`<@${mentionID}>, your **Voice Process Application** has been accepted 😊! Kindly join the <#${client.visa.ACCEPTED.WAITING_HALL}>`)

                const sbutton = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel(`Message`)
                            .setEmoji('📑')
                            .setStyle(ButtonStyle.Link)
                            .setURL(msgLink)
                    )

                client.users.cache.get(mentionID).send({
                    embeds: [embed],
                    components: [sbutton]
                }).catch(error => {

                    //LOG
                    if (error.code == 50007) {
                        const logembed = new EmbedBuilder()
                            .setColor('Black')
                            .setDescription(`Unable to DM <@${mentionID}> (VP Response Acc)`)

                        return client.channels.cache.get(client.visa.ACCEPTED.LOGCHAN).send({
                            embeds: [logembed]
                        });
                    } else {
                        const logembed = new EmbedBuilder()
                            .setColor('Black')
                            .setDescription(`DM sent to <@${mentionID}> (VP Response Acc)`)

                        client.channels.cache.get(client.visa.ACCEPTED.LOGCHAN).send({
                            embeds: [logembed]
                        });
                    }
                });
            }
        }

    }
};