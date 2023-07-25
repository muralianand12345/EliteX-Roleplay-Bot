const {
    Events,
    Collection,
    //WebhookClient
} = require('discord.js');

const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const feedcooldown = new Collection();
const rescooldown = new Collection();

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        /*const webhookClient = new WebhookClient({
            url: 'https://discord.com/api/webhooks/1129415507125219368/DBAT66W_nVAnHVpTzG8bMUSlvAdtUhkAXp9xWO-LJOpQ9fPW4WaBtOgpTENFIBKFf6Qk'
        });*/

        const sugChanID = "1129702667988520970";
        const sugchan = client.channels.cache.get(sugChanID);
        const resChanID = "1129702706060197908";
        const reschan = client.channels.cache.get(resChanID);

        var emsFeedbackEmbed = new EmbedBuilder();
        var emsResignationEmbed = new EmbedBuilder();
        var emsResignationButton = new ActionRowBuilder();

        //Suggestions

        if (interaction.customId == "ice-suggestions-button") {

            await sugchan.send({
                content: `**User: ${interaction.user.username} || ID: ${interaction.user.id} | has opened a Suggestion Form**`
            });

            if (feedcooldown.has(interaction.user.id)) {
                const cooldownTime = feedcooldown.get(interaction.user.id);
                const remainingTime = cooldownTime - Date.now();
                const remainingMinutes = Math.ceil(remainingTime / (1000 * 60));
                const remainingHours = Math.floor(remainingMinutes / 60);
                const minutesRemainder = remainingMinutes % 60;

                if (remainingTime <= 0) {
                    feedcooldown.delete(interaction.user.id);
                } else if (remainingHours >= 1) {
                    return interaction.reply({ content: `You are on a cooldown! Please wait ${remainingHours} hour(s) and ${minutesRemainder} minute(s).`, ephemeral: true });
                } else {
                    return interaction.reply({ content: `You are on a cooldown! Please wait ${remainingMinutes} minute(s).`, ephemeral: true });
                }

            } else {

                const emsfeedbackModal = new ModalBuilder()
                    .setCustomId('ems-feedback-modal')
                    .setTitle('EMS Feedback/Suggestion Form');

                const IcName = new TextInputBuilder()
                    .setCustomId('ems-feedback-icname')
                    .setLabel('What is your IC name?')
                    .setPlaceholder('Ignore to send Anonymously')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false);

                const Feedback = new TextInputBuilder()
                    .setCustomId('ems-feedback-content')
                    .setLabel('Your feedback or suggestions!')
                    .setMaxLength(1000)
                    .setMinLength(20)
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);


                const firstActionRow = new ActionRowBuilder().addComponents(IcName);
                const secondActionRow = new ActionRowBuilder().addComponents(Feedback);

                emsfeedbackModal.addComponents(firstActionRow, secondActionRow);
                await interaction.showModal(emsfeedbackModal);

                const cooldownDuration = 1800000; //30 minutes
                feedcooldown.set(interaction.user.id, Date.now() + cooldownDuration);
                setTimeout(() => {
                    feedcooldown.delete(interaction.user.id);
                }, cooldownDuration);
            }
        }

        if (interaction.customId == "ems-feedback-modal") {

            const emsFBIcName = interaction.fields.getTextInputValue('ems-feedback-icname');
            const emsFBContent = interaction.fields.getTextInputValue('ems-feedback-content');

            emsFeedbackEmbed.setDescription(`Submitted By <@${interaction.user.id}>`)
                .addFields(
                    { name: 'Doctor Name', value: `${emsFBIcName}` },
                    { name: 'Feedback/Suggestions', value: `${emsFBContent}` },
                );

            await sugchan.send({
                embeds: [emsFeedbackEmbed]
            }).then(async (msg) => {
                const emojiIds = client.feedback.EMOJI;
                for (let i = 0; i < emojiIds.length; i++) {
                    await msg.react(emojiIds[i % emojiIds.length]);
                }
                return interaction.reply({
                    content: 'Your EMS feedback/suggestion recieved successfully!',
                    ephemeral: true
                });
            });
        }

        //Resignation Form

        if (interaction.customId == "ice-resignation-button") {

            await reschan.send({
                content: `**User: ${interaction.user.username} || ID: ${interaction.user.id} | has opened a Resignation Form**`
            });

            if (rescooldown.has(interaction.user.id)) {
                const cooldownTime = rescooldown.get(interaction.user.id);
                const remainingTime = cooldownTime - Date.now();
                const remainingMinutes = Math.ceil(remainingTime / (1000 * 60));
                const remainingHours = Math.floor(remainingMinutes / 60);
                const minutesRemainder = remainingMinutes % 60;

                if (remainingTime <= 0) {
                    rescooldown.delete(interaction.user.id);
                } else if (remainingHours >= 1) {
                    return interaction.reply({ content: `You are on a cooldown! Please wait ${remainingHours} hour(s) and ${minutesRemainder} minute(s).`, ephemeral: true });
                } else {
                    return interaction.reply({ content: `You are on a cooldown! Please wait ${remainingMinutes} minute(s).`, ephemeral: true });
                }

            } else {

                const emsresginationModal = new ModalBuilder()
                    .setCustomId('ems-resignation-modal')
                    .setTitle('EMS Resignation Form');

                const IcName = new TextInputBuilder()
                    .setCustomId('ems-resignation-icname')
                    .setLabel('What is your IC name?')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const Designation = new TextInputBuilder()
                    .setCustomId('ems-resignation-designation')
                    .setLabel('What is your Designation?')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const Reason = new TextInputBuilder()
                    .setCustomId('ems-resignation-content')
                    .setLabel('Enter your reason for resignation')
                    .setMaxLength(1000)
                    .setMinLength(20)
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                const firstActionRow = new ActionRowBuilder().addComponents(IcName);
                const secondActionRow = new ActionRowBuilder().addComponents(Designation);
                const thirdActionRow = new ActionRowBuilder().addComponents(Reason);

                emsresginationModal.addComponents(firstActionRow, secondActionRow, thirdActionRow);
                await interaction.showModal(emsresginationModal);

                const cooldownDuration = 1800000 * 3; //30 minutes x 3
                rescooldown.set(interaction.user.id, Date.now() + cooldownDuration);
                setTimeout(() => {
                    rescooldown.delete(interaction.user.id);
                }, cooldownDuration);
            }
        }

        if (interaction.customId == "ems-resignation-modal") {

            const emsResIcName = interaction.fields.getTextInputValue('ems-resignation-icname');
            const emsResDesignation = interaction.fields.getTextInputValue('ems-resignation-designation');
            const emsResContent = interaction.fields.getTextInputValue('ems-resignation-content');

            emsResignationEmbed.setDescription(`Submitted By <@${interaction.user.id}>`)
                .addFields(
                    { name: 'Doctor Name', value: `${emsResIcName}` },
                    { name: 'Doctor\'s Designation', value: `${emsResDesignation}` },
                    { name: 'Reason', value: `${emsResContent}` },
                )
                .setFooter({ text: `${interaction.user.id}` });
            emsResignationButton.addComponents(
                new ButtonBuilder()
                    .setCustomId('ems-resignation-accept')
                    .setLabel('Accept')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('ems-resignation-reject')
                    .setLabel('Reject')
                    .setStyle(ButtonStyle.Danger)
            );

            await reschan.send({
                embeds: [emsResignationEmbed],
                components: [emsResignationButton]
            }).then(async (msg) => {
                return interaction.reply({
                    content: 'Your EMS Resignation recieved successfully!',
                    ephemeral: true
                });
            });
        }

        if (interaction.customId == "ems-resignation-accept") {
            const originalEmbed = interaction.message.embeds[0];
            const userId = originalEmbed.footer.text;
            const userMember = interaction.guild.members.cache.get(userId);
            if (!userMember) {
                return interaction.reply({ content: 'No user!', ephemeral: true });
            }
            await userMember.send({
                content: `We have received and accepted your EMS resignation! Please arrange a meeting at your earliest convenience to discuss the next steps.`
            });
            reschan.send({ content: `<@${userMember.id}>\'s resignation has been **accepted** by <@${interaction.user.id}>` });
            await interaction.message.delete();
        }

        if (interaction.customId == "ems-resignation-reject") {
            const originalEmbed = interaction.message.embeds[0];
            const userId = originalEmbed.footer.text;
            const userMember = interaction.guild.members.cache.get(userId);
            if (!userMember) {
                return interaction.reply({ content: 'No user!', ephemeral: true });
            }
            await userMember.send({
                content: `Your EMS resignation has been reviewed and has been rejected. If you would like to discuss this further, please schedule a meeting.`
            });
            reschan.send({ content: `<@${userMember.id}>\'s resignation has been **rejected** by <@${interaction.user.id}>` });
            await interaction.message.delete();
        }
    }
};