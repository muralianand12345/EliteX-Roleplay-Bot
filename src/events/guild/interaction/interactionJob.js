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
const ms = require('ms');

const roleModel = require('../../../events/mongodb/modals/roleremove.js');

const cooldown = new Collection();

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        var MsgContent;

        //Functions

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

        async function sendJobEmbed(client, interaction, jobName, answers) {

            const jobModalConf = client.jobs.MODALS[jobName.toUpperCase()];
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(`Submitted By <@${interaction.user.id}>`)
                .setFooter({ text: `${interaction.user.id}` });

            /*await answers.forEach(async (answer, index) => {
                const questionConf = jobModalConf[`Q${index + 1}`];
                embed.addFields({ name: `${questionConf.LABEL}`, value: `${answer}` });
            });*/

            for (const [index, answer] of answers.entries()) {
                const questionConf = jobModalConf[`Q${index + 1}`];
                embed.addFields({ name: `${questionConf.LABEL}`, value: `${answer}` });
                //await someAsyncFunction(answer); // Replace with your actual async function if needed
            }

            const button = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`${jobName}-accept`)
                        .setLabel('Accept')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`${jobName}-reject`)
                        .setLabel('Reject')
                        .setStyle(ButtonStyle.Danger)
                );
            const jobEmbedChan = client.jobs[jobName.toUpperCase()].SUBMIT;
            await client.channels.cache.get(jobEmbedChan).send({
                embeds: [embed],
                components: [button]
            }).then(async () => {
                return await interaction.editReply({
                    content: 'Your Application Submitted!',
                    ephemeral: true
                });
            });
        }

        async function sendJobModal(client, interaction, jobName) {
            const jobModalConf = client.jobs.MODALS[jobName];
            const styleMap = {
                "short": TextInputStyle.Short,
                "long": TextInputStyle.Paragraph
            };
            const Modal = new ModalBuilder()
                .setCustomId(`${jobName.toLowerCase()}-modal`)
                .setTitle(`${jobName.toUpperCase()} Application Form`);
            const questions = [];
            for (let i = 1; i <= 5; i++) {
                const questionConf = jobModalConf[`Q${i}`];
                const question = new TextInputBuilder()
                    .setCustomId(`${jobName.toLowerCase()}-q${i}`)
                    .setLabel(questionConf.LABEL)
                    .setPlaceholder(questionConf.PLACEHOLDER)
                    .setStyle(styleMap[questionConf.STYLE])
                    .setMaxLength(questionConf.MAXLEN)
                    .setMinLength(questionConf.MINLEN)
                    .setRequired(questionConf.REQUIRED);
                const questionRow = new ActionRowBuilder().addComponents(question);
                questions.push(questionRow);
            }
            Modal.addComponents(...questions);
            await interaction.showModal(Modal);
        }

        //Content

        switch (interaction.customId) {
            case 'apply-ems':
            case 'apply-media':
            case 'apply-taxi':
                const cooldownDuration = client.jobs.COOLDOWN;
                if (cooldown.has(`${interaction.customId}${interaction.user.id}`)) {
                    await interaction.deferReply({ ephemeral: true });
                    var coolMsg = client.config.MESSAGE["COOLDOWN_MESSAGE"]
                        .replace('<duration>', ms(cooldown.get(`${interaction.customId}${interaction.user.id}`) - Date.now(), { long: true }));
                    const coolEmbed = new EmbedBuilder()
                        .setDescription(`${coolMsg}`)
                        .setColor('#ED4245');
                    await interaction.editReply({ embeds: [coolEmbed], ephemeral: true });
                    break;
                } else {
                    const jobType = interaction.customId.split('-')[1].toUpperCase();
                    await sendJobModal(client, interaction, jobType);

                    cooldown.set(`${interaction.customId}${interaction.user.id}`, Date.now() + cooldownDuration);
                    setTimeout(() => {
                        cooldown.delete(`${interaction.customId}${interaction.user.id}`);
                    }, cooldownDuration);
                    break;
                }
            case 'ems-modal':
            case 'taxi-modal':
            case 'media-modal':
                await interaction.deferReply({ ephemeral: true });
                const jobName = interaction.customId.split('-')[0];
                const jobAnswers = [];
                for (let i = 1; i <= 5; i++) {
                    jobAnswers.push(interaction.fields.getTextInputValue(`${jobName}-q${i}`));
                }
                await sendJobEmbed(client, interaction, jobName, jobAnswers);
                break;

            case 'ems-accept':
            case 'taxi-accept':
            case 'media-accept':
                await interaction.deferReply({ ephemeral: true });
                const jobTypeAcc = interaction.customId.split('-')[0].toUpperCase();

                const chanAcc = client.channels.cache.get(client.jobs[jobTypeAcc].ACCCHAN);

                const originalEmbed = interaction.message.embeds[0];
                const userId = originalEmbed.footer.text;
                const userMember = interaction.guild.members.cache.get(userId);
                if (!userMember) {
                    await interaction.editReply({ content: 'No user!', ephemeral: true });
                    break;
                }
                const role = interaction.guild.roles.cache.get(client.jobs[jobTypeAcc].INTERVIEW);
                if (!role) {
                    await interaction.editReply({
                        content: 'The specified role does not exist in this guild.',
                        ephemeral: true
                    });
                    break;
                }
                const roleJob = interaction.guild.roles.cache.get(client.jobs[jobTypeAcc].ROLEID);
                if (!roleJob) {
                    await interaction.editReply({
                        content: 'The specified role does not exist in this guild.',
                        ephemeral: true
                    });
                    break;
                }
                if (userMember.roles.cache.has(role.id)) {
                    await interaction.editReply({ content: 'The user already has the role', ephemeral: true });
                } else if (userMember.roles.cache.has(roleJob.id)) {
                    await interaction.editReply({ content: 'The user already has the role', ephemeral: true });
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
                    await RoleLog(jobTypeAcc, 'Accepted', userMember.id, interaction.user.id);
                    MsgContent = `<@${userId}>, ${client.jobs[jobTypeAcc].ACCMSG}`;
                    await chanAcc.send(`${MsgContent}`);
                    await interaction.editReply({ content: `Interview Role Added and Accepted!`, ephemeral: true });
                }
                await interaction.message.edit({ components: [] });
                break;

            case 'ems-reject':
            case 'taxi-reject':
            case 'media-reject':
                await interaction.deferReply({ ephemeral: true });
                const jobTypeRej = interaction.customId.split('-')[0].toUpperCase();
                const chanRej = client.channels.cache.get(client.jobs[jobTypeRej].ACCCHAN);

                const originalEmbedRej = interaction.message.embeds[0];
                const userIdRej = originalEmbedRej.footer.text;
                const userMemberRej = interaction.guild.members.cache.get(userIdRej);

                if (!userMemberRej) {
                    await interaction.editReply({ content: 'No user!', ephemeral: true });
                    break;
                }
                const roleRej = interaction.guild.roles.cache.get(client.jobs[jobTypeRej].INTERVIEW);
                if (!roleRej) {
                    await interaction.editReply({
                        content: 'The specified role does not exist in this guild.',
                        ephemeral: true
                    });
                    break;
                }
                const roleJobRej = interaction.guild.roles.cache.get(client.jobs[jobTypeRej].ROLEID);
                if (!roleJobRej) {
                    await interaction.editReply({
                        content: 'The specified role does not exist in this guild.',
                        ephemeral: true
                    });
                    break;
                }
                if (userMemberRej.roles.cache.has(roleRej.id)) {
                    await interaction.editReply({ content: 'The user already has the role', ephemeral: true });
                } else if (userMemberRej.roles.cache.has(roleJobRej.id)) {
                    await interaction.editReply({ content: 'The user already has the role', ephemeral: true });
                } else {
                    await RoleLog(jobTypeRej, 'Rejected', userMemberRej.id, interaction.user.id);
                    MsgContent = `<@${userIdRej}>, ${client.jobs[jobTypeRej].REJMSG}`;
                    await chanRej.send(`${MsgContent}`);
                    await interaction.editReply({ content: `Interview Role Removed and Rejected!`, ephemeral: true });
                }
                await interaction.message.edit({ components: [] });
                break;


            default:
                break;
        }
    }
}