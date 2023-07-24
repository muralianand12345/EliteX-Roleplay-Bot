const {
    Events,
    Collection
} = require('discord.js');
//Modals
const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require('discord.js');
//Embed and Buttons
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const cooldown = new Collection();

const modMailModel = require("../../../events/mongodb/modals/modmail.js");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        if (interaction.customId == "modmail-start") {

            if (cooldown.has(interaction.user.id)) {
                const cooldownTime = cooldown.get(interaction.user.id);
                const remainingTime = cooldownTime - Date.now();
                const remainingMinutes = Math.ceil(remainingTime / (1000 * 60));
                const remainingHours = Math.floor(remainingMinutes / 60);
                const minutesRemainder = remainingMinutes % 60;

                if (remainingTime <= 0) {
                    cooldown.delete(interaction.user.id);
                } else if (remainingHours >= 1) {
                    return interaction.reply({ content: `You are on a cooldown! Please wait ${remainingHours} hour(s) and ${minutesRemainder} minute(s) before using this ModMail again.`, ephemeral: true });
                } else {
                    return interaction.reply({ content: `You are on a cooldown! Please wait ${remainingMinutes} minute(s) before using this ModMail again.`, ephemeral: true });
                }

            } else {

                const modmailmodal = new ModalBuilder()
                    .setCustomId('modmail-modal')
                    .setTitle('Iconic RP ModMail');

                const Title = new TextInputBuilder()
                    .setCustomId('modmail-modal-title')
                    .setPlaceholder('e.g. "How to connect the server"')
                    .setLabel('Give your request a title')
                    .setRequired(true)
                    .setStyle(TextInputStyle.Short);

                const Description = new TextInputBuilder()
                    .setCustomId('modmail-modal-description')
                    .setLabel('What is your inquiry about?')
                    .setPlaceholder('Explain your issue in detail')
                    .setMaxLength(3000)
                    .setMinLength(20)
                    .setRequired(true)
                    .setStyle(TextInputStyle.Paragraph);

                const firstActionRow = new ActionRowBuilder().addComponents(Title);
                const secondActionRow = new ActionRowBuilder().addComponents(Description);
                modmailmodal.addComponents(firstActionRow, secondActionRow);
                await interaction.showModal(modmailmodal);

                const cooldownDuration = 1800000 * 3; //30 minutes
                cooldown.set(interaction.user.id, Date.now() + cooldownDuration);
                setTimeout(() => {
                    cooldown.delete(interaction.user.id);
                }, cooldownDuration);
            }

        }

        if (interaction.customId == "modmail-modal") {

            const modMailData = await modMailModel.findOne({
                userID: interaction.user.id
            });

            if (modMailData) {
                if (modMailData.status == false) {
                    modMailData.status = true;
                    modMailData.count += 1;
                    await modMailData.save();

                    const Title = interaction.fields.getTextInputValue('modmail-modal-title') || "No Title";
                    const Description = interaction.fields.getTextInputValue('modmail-modal-description') || "No Description";

                    const channelId = client.modmail.ForumChanID;
                    const channel = client.channels.cache.get(channelId);
                    if (!channel) return console.log(`Channel not found with ID ${channelId}`);

                    const thread = await channel.threads.create({
                        name: `ModMail - ${interaction.user.username}`,
                        autoArchiveDuration: 1440, // 24 hours (in minutes)
                        reason: 'ModMail Thread',
                    });

                    modMailData.threadID = thread.id;
                    await modMailData.save();

                    const embed = new EmbedBuilder()
                        .setColor('Yellow')
                        .setTitle(`**ModMail Thread | ${interaction.user.username}**`)
                        .setDescription(`UserName: <@${interaction.user.id}> | \`${interaction.user.id}\``)
                        .setFields(
                            { name: 'Title', value: `${Title}` },
                            { name: 'Description', value: `${Description}` }
                        )
                        .setFooter({ text: 'Send a Message to Reply!' });
                    const button = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('modmail-close')
                                .setEmoji('🔒')
                                .setLabel('Close')
                                .setStyle(ButtonStyle.Danger)
                        );

                    await thread.send({ embeds: [embed], components: [button] });
                    await interaction.user.send({ content: "⏳ Wait patiently for our staff to respond, you'll be notified here!" });
                    await interaction.reply({ content: 'ModMail Created!', ephemeral: true }).then(async()=>{
                        await interaction.message.delete();
                    });
                }
            } else {
                return interaction.reply({ content: 'You already have a modmail opened! | If not contact the discord developer.', ephemeral: true });
            }
        }
    }
}