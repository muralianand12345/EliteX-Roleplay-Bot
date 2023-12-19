const {
    Events,
    EmbedBuilder,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require('discord.js');

const visaFormUserModal = require('../../database/modals/visaFormUser.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        var visaFormData;

        if (interaction.customId == 'visa-form') {
            if (interaction.user.bot) return;
            if (client.config.visaform.enable == false) return interaction.reply({ content: 'Visa Form is currently disabled!', ephemeral: true });

            visaFormData = await visaFormUserModal.findOne({
                userId: interaction.user.id,
                guildId: interaction.guild.id
            });

            if (!visaFormData) {
                visaFormData = new visaFormUserModal({
                    guildId: interaction.guild.id,
                    userId: interaction.user.id,
                    rockstarId: null,
                    answer: [],
                    active: false
                });
                await visaFormData.save();
            }

            if (visaFormData.active == true) return interaction.reply({ content: 'You already have an active visa form!', ephemeral: true });

            const visaFormModal = new ModalBuilder()
                .setCustomId('visa-form-modal')
                .setTitle('Iconic RP Visa Form');

            const questions = [];
            for (const [questionKey, questionConfig] of Object.entries(client.config.visaform.context)) {
                const styleMap = {
                    "short": TextInputStyle.Short,
                    "long": TextInputStyle.Paragraph
                };
                const textInput = new TextInputBuilder()
                    .setCustomId(`visa-form-${questionKey}`)
                    .setLabel(questionConfig.label)
                    .setPlaceholder(questionConfig.placeholder)
                    .setStyle(styleMap[questionConfig.style])
                    .setRequired(questionConfig.required)
                    .setMinLength(questionConfig.min)
                    .setMaxLength(questionConfig.max);
                const questionRow = new ActionRowBuilder().addComponents(textInput);
                questions.push(questionRow);
            }
            visaFormModal.addComponents(...questions);
            await interaction.showModal(visaFormModal);
        }

        if (interaction.customId == "visa-form-modal") {

            await interaction.deferReply({ ephemeral: true });

            var userAnswer = [];

            var visaembed = new EmbedBuilder()
                .setColor('Green')
                .setAuthor({
                    name: 'ICONIC Roleplay',
                    iconURL: 'https://cdn.discordapp.com/attachments/1097420467532472340/1099594273176965191/Artboard_2.png',
                    url: 'https://discord.gg/8pEzKpqFgK'
                })
                .setDescription(`User: <@${interaction.user.id}> | \`${interaction.user.id} has submitted a visa form!\``)
                .setTimestamp();

            visaFormData = await visaFormUserModal.findOne({
                userId: interaction.user.id,
                guildId: interaction.guild.id
            });

            if (!visaFormData) return;

            const questions = client.config.visaform.context;
            for (const [questionKey, questionConfig] of Object.entries(questions)) {
                const answer = interaction.fields.getTextInputValue(`visa-form-${questionKey}`) || null;

                if (questionConfig.label.toLowerCase().includes('rockstar')) {
                    visaFormData.rockstarId = answer;
                    await visaFormData.save();
                }

                visaembed.addFields({ name: `${questionConfig.label}`, value: `${answer}` });

                userAnswer.push({
                    question: questionConfig.label,
                    answer: answer
                });
            }

            await visaFormData.updateOne({
                answer: userAnswer,
                active: true
            });

            const embed = new EmbedBuilder()
                .setColor('Green')
                .setAuthor({
                    name: 'ICONIC Roleplay',
                    iconURL: 'https://cdn.discordapp.com/attachments/1097420467532472340/1099594273176965191/Artboard_2.png',
                    url: 'https://discord.gg/8pEzKpqFgK'
                })
                .setDescription(`**Your visa form has been submitted successfully!**\n\n**Please wait for the staff to review your application.**\n\n**You will be notified once your application is reviewed.**`)
                .setThumbnail('https://cdn.discordapp.com/attachments/1097420467532472340/1099666661990219887/Logo.gif');

            await interaction.editReply({ embeds: [embed], ephemeral: true });
            await client.channels.cache.get(client.config.visaform.logchannel).send({ embeds: [visaembed] });
        }
    }
}