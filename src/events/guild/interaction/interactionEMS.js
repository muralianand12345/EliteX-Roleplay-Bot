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

        var EMSEmbed = new EmbedBuilder();
        var button = new ActionRowBuilder()

        if (interaction.customId == "apply-ice") {

            if (cooldown.has(interaction.user.id)) {
                return interaction.reply({ content: `You are on a cooldown!`, ephemeral: true });
            } else {

                const emsModal = new ModalBuilder()
                    .setCustomId('ems-modal')
                    .setTitle('ICE Application Form');

                const CharName = new TextInputBuilder()
                    .setCustomId('ems-charname')
                    .setLabel('Character Name and IC phone number')
                    .setPlaceholder('Name - Phone Number')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(100)
                    .setRequired(true);

                const RealAge = new TextInputBuilder()
                    .setCustomId('ems-realage')
                    .setLabel('Real Age')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(100)
                    .setRequired(true);

                const FitDoc = new TextInputBuilder()
                    .setCustomId('ems-firdoc')
                    .setLabel('Why you think you are best fit for doctor?')
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(100)
                    .setRequired(true);

                const WorkingHrs = new TextInputBuilder()
                    .setCustomId('ems-working')
                    .setLabel('How many hours can you put in per day?')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const Experience = new TextInputBuilder()
                    .setCustomId('ems-experience')
                    .setLabel('Do you have any previous experience?')
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(1000)
                    .setRequired(true);

                const firstActionRow = new ActionRowBuilder().addComponents(CharName);
                const secondActionRow = new ActionRowBuilder().addComponents(RealAge);
                const thirdActionRow = new ActionRowBuilder().addComponents(FitDoc);
                const fourthActionRow = new ActionRowBuilder().addComponents(WorkingHrs);
                const fivethActionRow = new ActionRowBuilder().addComponents(Experience);

                emsModal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow, fivethActionRow);
                await interaction.showModal(emsModal);

                cooldown.set(interaction.user.id);
                setTimeout(() => {
                    cooldown.delete(interaction.user.id);
                }, 10000);
            }
        }

        if (interaction.customId == "ems-modal") {

            await interaction.deferReply({ ephemeral: true });

            const EMSCharName = interaction.fields.getTextInputValue('ems-charname');
            const EMSRealAge = interaction.fields.getTextInputValue('ems-realage');
            const EMSFitDoc = interaction.fields.getTextInputValue('ems-firdoc');
            const EMSWorking = interaction.fields.getTextInputValue('ems-working');
            const EMSExp = interaction.fields.getTextInputValue('ems-experience');

            EMSEmbed.setColor('Red')
                .setDescription(`Submitted By <@${interaction.user.id}>`)
                .addFields(
                    { name: 'Char Name', value: `${EMSCharName}` },
                    { name: 'Real Age', value: `${EMSRealAge}` },
                    { name: 'Fit Doctor', value: `${EMSFitDoc}` },
                    { name: 'Working', value: `${EMSWorking}` },
                    { name: 'Experience', value: `${EMSExp}` }
                )
                .setFooter({ text: `${interaction.user.id}` });
            button.addComponents(
                new ButtonBuilder()
                    .setCustomId('ems-accept')
                    .setLabel('Accept')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('ems-reject')
                    .setLabel('Reject')
                    .setStyle(ButtonStyle.Danger)
            )

            await client.channels.cache.get(client.jobs.EMS.SUBMIT).send({
                embeds: [EMSEmbed],
                components: [button]
            }).then(async (msg) => {
                return interaction.editReply({ content: 'Your ICE Form recieved successfully!', ephemeral: true });
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

        if (interaction.customId == "ems-accept") {

            await interaction.deferReply({ ephemeral: true });

            const originalEmbed = interaction.message.embeds[0];
            const userId = originalEmbed.footer.text;
            const chan = client.channels.cache.get(client.jobs.EMS.ACCCHAN);
            const JobName = client.jobs.EMS.NAME;
            const userMember = interaction.guild.members.cache.get(userId);

            if (!userMember) {
                return interaction.editReply({ content: 'No user!', ephemeral: true });
            }
            const role = interaction.guild.roles.cache.get(client.jobs.EMS.INTERVIEW);
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
                var MsgContent = `<@${userId}>, **Congratulations on being selected for an EMS interview! We are excited to learn more about you and discuss your potential role in our EMS team. Please contact us to schedule the interview at your earliest convenience.**`;
                await chan.send(`${MsgContent}`);
                interaction.editReply({ content: `Interview Role Added and Accepted! <@${userMember.id}>`, ephemeral: true });
            }
            await interaction.message.delete();
        }

        if (interaction.customId == "ems-reject") {

            await interaction.deferReply({ ephemeral: true });

            const originalEmbed = interaction.message.embeds[0];
            const userId = originalEmbed.footer.text;
            const chan = client.channels.cache.get(client.jobs.EMS.ACCCHAN);
            const JobName = client.jobs.EMS.NAME;

            const userMember = interaction.guild.members.cache.get(userId);
            if (!userMember) {
                return interaction.editReply({ content: 'No user!', ephemeral: true });
            }
            const role = interaction.guild.roles.cache.get(client.jobs.EMS.INTERVIEW);
            if (!role) {
                return interaction.editReply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
            }
            if (userMember.roles.cache.has(role.id)) {
                interaction.editReply({ content: 'The user already has the role', ephemeral: true });
            } else {
                await userMember.roles.remove(role);
                await RoleLog(JobName, 'Rejected', userMember.id, interaction.user.id);
                var MsgContent = `<@${userId}>, **Thank you for your interest in the EMS. After careful consideration, we regret to inform you that we have chosen not to proceed with your application at this time. We appreciate your understanding and encourage you to apply for future opportunities.**`;
                await chan.send(`${MsgContent}`);
                interaction.editReply({ content: `Interview Role Removed and Rejected! <@${userMember.id}>`, ephemeral: true });
            }
            await interaction.message.delete();
        }
    }
}