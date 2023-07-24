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
    ButtonStyle
} = require("discord.js");

const roleModel = require('../../../events/mongodb/modals/roleremove.js');

const cooldown = new Collection();

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        var TaxiEmbed = new EmbedBuilder();
        var button = new ActionRowBuilder()

        if (interaction.customId == "apply-news") {

            if (cooldown.has(interaction.user.id)) {
                return interaction.reply({ content: `You are on a cooldown!`, ephemeral: true });
            } else {

                const TaxiModal = new ModalBuilder()
                    .setCustomId('news-modal')
                    .setTitle('Iconic Media Application Form');

                const FormQ1 = new TextInputBuilder()
                    .setCustomId('news-charname')
                    .setLabel('Character Name and IC phone number')
                    .setPlaceholder('Name - Phone Number')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(100)
                    .setRequired(true);

                const FormQ2 = new TextInputBuilder()
                    .setCustomId('news-realage')
                    .setLabel('Real Age')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(100)
                    .setRequired(true);

                const FormQ3 = new TextInputBuilder()
                    .setCustomId('news-hours')
                    .setLabel('How many hours you can spend in a day?')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(1000)
                    .setRequired(true);

                const FormQ4 = new TextInputBuilder()
                    .setCustomId('news-experience')
                    .setLabel('Do you have any previous experience?')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const FormQ5 = new TextInputBuilder()
                    .setCustomId('news-wish')
                    .setLabel('Why do you wish to be a journalist?')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(1000)
                    .setRequired(true);

                const firstActionRow = new ActionRowBuilder().addComponents(FormQ1);
                const secondActionRow = new ActionRowBuilder().addComponents(FormQ2);
                const thirdActionRow = new ActionRowBuilder().addComponents(FormQ3);
                const fourthActionRow = new ActionRowBuilder().addComponents(FormQ4);
                const fivethActionRow = new ActionRowBuilder().addComponents(FormQ5);

                TaxiModal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow, fivethActionRow);
                await interaction.showModal(TaxiModal);

                cooldown.set(interaction.user.id);
                setTimeout(() => {
                    cooldown.delete(interaction.user.id);
                }, 10000);
            }
        }

        if (interaction.customId == "news-modal") {

            await interaction.deferReply({ ephemeral: true });

            const Ques1 = interaction.fields.getTextInputValue('news-charname');
            const Ques2 = interaction.fields.getTextInputValue('news-realage');
            const Ques3 = interaction.fields.getTextInputValue('news-hours');
            const Ques4 = interaction.fields.getTextInputValue('news-experience');
            const Ques5 = interaction.fields.getTextInputValue('news-wish');

            TaxiEmbed.setColor('Red')
                .setDescription(`Submitted By <@${interaction.user.id}>`)
                .addFields(
                    { name: 'Char Name', value: `${Ques1}` },
                    { name: 'Real Age', value: `${Ques2}` },
                    { name: 'How many hours you can spend in a day?', value: `${Ques3}` },
                    { name: 'Do you have any previous experience?', value: `${Ques4}` },
                    { name: 'Why do you wish to be a journalist?', value: `${Ques5}` }
                )
                .setFooter({ text: `${interaction.user.id}` });
            button.addComponents(
                new ButtonBuilder()
                    .setCustomId('news-accept')
                    .setLabel('Accept')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('news-reject')
                    .setLabel('Reject')
                    .setStyle(ButtonStyle.Danger)
            )

            await client.channels.cache.get(client.jobs.MEDIA.SUBMIT).send({
                embeds: [TaxiEmbed],
                components: [button]
            }).then(async (msg) => {
                return interaction.editReply({ content: 'Your Iconic Media Form recieved successfully!', ephemeral: true });
            });
        }

        async function RoleLog(Job, type, TouserId, FromuserId) {
            const logembed = new EmbedBuilder()
                .setColor('#FFFFFF')
                .setDescription(`${Job} | Type: ${type}`)
                .addFields(
                    { name: 'To', value: `<@${TouserId}>` },
                    { name: 'By', value: `<@${FromuserId}>` }
                );

            await client.channels.cache.get(client.jobs.LOG.CHANID).send({ embeds: [logembed] });
        }

        if (interaction.customId == "news-accept") {

            await interaction.deferReply({ ephemeral: true });

            const originalEmbed = interaction.message.embeds[0];
            const userId = originalEmbed.footer.text;
            const chan = client.channels.cache.get(client.jobs.MEDIA.ACCCHAN);
            const JobName = client.jobs.MEDIA.NAME;

            const userMember = interaction.guild.members.cache.get(userId);
            if (!userMember) {
                return interaction.editReply({ content: 'No user!', ephemeral: true });
            }

            const role = interaction.guild.roles.cache.get(client.jobs.MEDIA.INTERVIEW);
            if (!role) {
                return interaction.editReply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
            }


            if (userMember.roles.cache.has(role.id)) {
                interaction.editReply({ content: 'The user already has the role', ephemeral: true });
            } else {
                const expirationDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
                const newRoleData = new roleModel({
                    userId: userMember.id,
                    roleId: role.id,
                    expirationDate: expirationDate,
                    guildId: interaction.guild.id
                });
                await newRoleData.save();
                await userMember.roles.add(role);
                await RoleLog(JobName, 'Accepted', userMember.id, interaction.user.id);
                var MsgContent = `<@${userId}>, **Congratulations on being selected for an Iconic Media interview! We are excited to learn more about you and discuss your potential role in our Iconic Media team. Please contact us to schedule the interview at your earliest convenience.**`;
                await chan.send(`${MsgContent}`);
                interaction.editReply({ content: `Interview Role Added and Accepted! <@${userMember.id}>`, ephemeral: true });
            }

            await interaction.message.delete();
        }

        if (interaction.customId == "news-reject") {

            await interaction.deferReply({ ephemeral: true });

            const originalEmbed = interaction.message.embeds[0];
            const userId = originalEmbed.footer.text;
            const chan = client.channels.cache.get(client.jobs.MEDIA.ACCCHAN);
            const JobName = client.jobs.MEDIA.NAME;

            const userMember = interaction.guild.members.cache.get(userId);
            if (!userMember) {
                return interaction.editReply({ content: 'No user!', ephemeral: true });
            }

            const role = interaction.guild.roles.cache.get(client.jobs.MEDIA.INTERVIEW);
            if (!role) {
                return interaction.editReply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
            }


            if (userMember.roles.cache.has(role.id)) {
                interaction.editReply({ content: 'The user already has the role', ephemeral: true });
            } else {
                await userMember.roles.remove(role);
                await RoleLog(JobName, 'Rejected', userMember.id, interaction.user.id);
                var MsgContent = `<@${userId}>, **Thank you for your interest in the Iconic Media. After careful consideration, we regret to inform you that we have chosen not to proceed with your application at this time. We appreciate your understanding and encourage you to apply for future opportunities.**`;
                await chan.send(`${MsgContent}`);
                interaction.editReply({ content: `Interview Role Removed and Rejected! <@${userMember.id}>`, ephemeral: true });
            }

            await interaction.message.delete();
        }
    }
}