const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

const roleModel = require('../../events/mongodb/modals/roleremove.js');

module.exports = {
    cooldown: 2000,

    data: new SlashCommandBuilder()
        .setName('govtresponse')
        .setDescription('Job Response (Only Govt Jobs)')
        .setDMPermission(false)
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Tag User')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('option')
                .setDescription('Role type')
                .setRequired(true)
                .addChoices(
                    { name: 'Accept', value: 'accept' },
                    { name: 'Reject', value: 'reject' }
                )
        )
        .addNumberOption(option =>
            option
                .setName('application-number')
                .setDescription('Application Number')
                .setRequired(false)
        ),
    async execute(interaction, client) {

        const user = interaction.options.getUser('user');
        const appNo = interaction.options.getNumber('application-number') || null;

        const userMember = interaction.guild.members.cache.get(user.id);
        if (!userMember) {
            return interaction.reply({ content: 'No user!', ephemeral: true });
        }

        const isBot = user.bot;
        if (isBot) {
            return interaction.reply({ content: 'The specified user is a bot!', ephemeral: true });
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

        if (interaction.member.roles.cache.has(client.jobs.PD.HO)) {

            var userContentAcc;
            var userContentRej;

            if (!appNo) {
                userContentAcc = `<@${userMember.id}>, **Your form for PD Application has been accepted and an Interview role has been provided. Kindly get proper licenses and visit our Police Department when the Interview is scheduled in ICPD Notice Board.**`;
                userContentRej = `<@${userMember.id}>, **Unfortunately your form for the PD application has been rejected as the form was not filled properly.**`;
            } else {
                userContentAcc = `Application Number: ${appNo.toString()} | <@${userMember.id}>, **Your form for PD Application has been accepted and an Interview role has been provided. Kindly get proper licenses and visit our Police Department when the Interview is scheduled in ICPD Notice Board.**`;
                userContentRej = `Application Number: ${appNo.toString()} | <@${userMember.id}>, **Unfortunately your form for the PD application has been rejected as the form was not filled properly.**`
            }

            const option = await interaction.options.getString("option");
            const JobName = client.jobs.PD.NAME;

            if (option === 'accept') {
                const role = interaction.guild.roles.cache.get(client.jobs.PD.INTERVIEW);
                if (!role) {
                    return interaction.reply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
                }

                const chan = client.channels.cache.get(client.jobs.PD.ACCCHAN);

                if (userMember.roles.cache.has(role.id)) {
                    return interaction.reply({ content: 'The user already has the role', ephemeral: true });
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
                    await RoleLog(JobName, option, userMember.id, interaction.user.id);
                    await chan.send({ content: `${userContentAcc}` });
                    return interaction.reply({ content: `Interview Role Added and Accepted! <@${userMember.id}>`, ephemeral: true });
                }
            }

            if (option === 'reject') {

                const chan = client.channels.cache.get(client.jobs.PD.ACCCHAN);
                await RoleLog(JobName, option, userMember.id, interaction.user.id);
                await chan.send({ content: `${userContentRej}` });
                return interaction.reply({ content: `Interview Rejected! <@${userMember.id}>`, ephemeral: true });
            }


        } /*else if (interaction.member.roles.cache.has(client.jobs.EMS.HO)) {

            const option = await interaction.options.getString("option");
            const JobName = client.jobs.EMS.NAME;

            if (option === 'accept') {
                const role = interaction.guild.roles.cache.get(client.jobs.EMS.INTERVIEW);
                if (!role) {
                    return interaction.reply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
                }

                const chan = client.channels.cache.get(client.jobs.EMS.ACCCHAN);

                if (userMember.roles.cache.has(role.id)) {
                    return interaction.reply({ content: 'The user already has the role', ephemeral: true });
                } else {
                    await userMember.roles.add(role);
                    await RoleLog(JobName, option, userMember.id, interaction.user.id);
                    await chan.send({ content: `<@${userMember.id}>, **Your form for EMS Application has been accepted and an Interview role has been provided. Kindly get proper licenses and visit our Police Department when the Interview is scheduled in ICE Notice Board.**` });
                    return interaction.reply({ content: `Interview Role Added and Accepted! <@${userMember.id}>`, ephemeral: true });
                }
            }

            if (option === 'reject') {

                const chan = client.channels.cache.get(client.jobs.EMS.ACCCHAN);
                await RoleLog(JobName, option, userMember.id, interaction.user.id);
                await chan.send({ content: `<@${userMember.id}>, **Unfortunately your form for the EMS application has been rejected as the form was not filled properly.**` });
                return interaction.reply({ content: `Interview Rejected! <@${userMember.id}>`, ephemeral: true });
            }
        }*/ else {
            return interaction.reply({ content: 'You Are Not Authorized!', ephemeral: true });
        }
    }
}