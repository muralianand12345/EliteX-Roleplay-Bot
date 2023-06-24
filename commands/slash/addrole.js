const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

module.exports = {
    cooldown: 2000,

    data: new SlashCommandBuilder()
        .setName('addrole')
        .setDescription("Add Role (Only Govt Jobs)")
        .setDMPermission(false)
        .addUserOption(option => option
            .setName('gr-user')
            .setDescription('User to give role')
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName('gr-option')
            .setDescription('Role type')
            .setRequired(true)
            .addChoices(
                { name: 'Interview', value: 'gr-interview' },
                { name: 'Job Role', value: 'gr-job' },
                { name: 'Remove Role', value: 'gr-remove' },
            )
        ),
    async execute(interaction, client) {

        //log
        const commandName = "ADDROLE";
        client.std_log.error(client, commandName, interaction.user.id, interaction.channel.id);

        const userGR = interaction.options.getUser('gr-user');

        if (userGR.bot) return interaction.reply({ content: 'Cannot give role to bot!', ephemeral: true });
        const userMember = interaction.guild.members.cache.get(userGR.id);
        if (!userMember) return interaction.reply({ content: 'No user!', ephemeral: true });
        const isBot = userGR.bot;
        if (isBot) return interaction.reply({ content: 'The specified user is a bot!', ephemeral: true });
        if (!userMember.roles.cache.has(client.visa.VISA.ROLEID1)) return await interaction.reply({ content: "The user has no Visa Holder Role!", ephemeral: true });

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
            const option = await interaction.options.getString("gr-option");
            const JobName = client.jobs.PD.NAME;

            if (option === 'gr-interview') {
                const role = interaction.guild.roles.cache.get(client.jobs.PD.INTERVIEW);
                if (!role) {
                    return interaction.reply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
                }
                if (userMember.roles.cache.has(role.id)) {
                    return interaction.reply({ content: 'The user already has the role', ephemeral: true });
                } else {
                    await userMember.roles.add(role);
                    await RoleLog(JobName, option, userMember.id, interaction.user.id);
                    return interaction.reply({ content: `Interview Role Added! <@${userMember.id}>`, ephemeral: true });
                }
            }

            if (option === 'gr-job') {
                const role = interaction.guild.roles.cache.get(client.jobs.PD.ROLEID);
                if (!role) {
                    return interaction.reply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
                }
                const roleinter = interaction.guild.roles.cache.get(client.jobs.PD.INTERVIEW);
                if (!roleinter) {
                    return interaction.reply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
                }
                if (userMember.roles.cache.has(role.id)) {
                    return interaction.reply({ content: 'The user already has the role', ephemeral: true });
                } else {
                    await userMember.roles.add(role);
                    await userMember.roles.remove(roleinter);
                    await RoleLog(JobName, option, userMember.id, interaction.user.id);
                    return interaction.reply({ content: `PD Role Added! <@${userMember.id}>`, ephemeral: true });
                }
            }

            if (option === 'gr-remove') {
                const role = interaction.guild.roles.cache.get(client.jobs.PD.ROLEID);
                if (!role) {
                    return interaction.reply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
                }
                const roleinter = interaction.guild.roles.cache.get(client.jobs.PD.INTERVIEW);
                if (!roleinter) {
                    return interaction.reply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
                }
                if (userMember.roles.cache.has(role.id)) {
                    await userMember.roles.remove(role);
                    await userMember.roles.remove(roleinter);
                    await RoleLog(JobName, option, userMember.id, interaction.user.id);
                    return interaction.reply({ content: `PD Role Removed! <@${userMember.id}>`, ephemeral: true });
                } else {
                    await userMember.roles.remove(roleinter);
                    return interaction.reply({ content: 'The user has no role', ephemeral: true });
                }
            }

        } else if (interaction.member.roles.cache.has(client.jobs.EMS.HO)) {

            const option = await interaction.options.getString("gr-option");
            const JobName = client.jobs.EMS.NAME;

            if (option === 'gr-interview') {
                const role = interaction.guild.roles.cache.get(client.jobs.EMS.INTERVIEW);
                if (!role) {
                    return interaction.reply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
                }
                if (userMember.roles.cache.has(role.id)) {
                    return interaction.reply({ content: 'The user already has the role', ephemeral: true });
                } else {
                    await userMember.roles.add(role);
                    await RoleLog(JobName, option, userMember.id, interaction.user.id);
                    return interaction.reply({ content: `Interview Role Added! <@${userMember.id}>`, ephemeral: true });
                }
            }

            if (option === 'gr-job') {
                const role = interaction.guild.roles.cache.get(client.jobs.EMS.ROLEID);
                if (!role) {
                    return interaction.reply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
                }
                const roleinter = interaction.guild.roles.cache.get(client.jobs.EMS.INTERVIEW);
                if (!roleinter) {
                    return interaction.reply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
                }
                if (userMember.roles.cache.has(role.id)) {
                    return interaction.reply({ content: 'The user already has the role', ephemeral: true });
                } else {
                    await userMember.roles.add(role);
                    await userMember.roles.remove(roleinter);
                    await RoleLog(JobName, option, userMember.id, interaction.user.id);
                    return interaction.reply({ content: `EMS Role Added! <@${userMember.id}>`, ephemeral: true });
                }
            }

            if (option === 'gr-remove') {
                const role = interaction.guild.roles.cache.get(client.jobs.EMS.ROLEID);
                if (!role) {
                    return interaction.reply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
                }
                const roleinter = interaction.guild.roles.cache.get(client.jobs.EMS.INTERVIEW);
                if (!roleinter) {
                    return interaction.reply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
                }
                const rolecool = interaction.guild.roles.cache.get(client.jobs.GOVTCOOL);
                if (!rolecool) {
                    return interaction.reply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
                }
                if (userMember.roles.cache.has(role.id)) {
                    await userMember.roles.add(rolecool);
                    await userMember.roles.remove(role);
                    await userMember.roles.remove(roleinter);
                    await RoleLog(JobName, option, userMember.id, interaction.user.id);
                    return interaction.reply({ content: `EMS Role Removed! <@${userMember.id}>`, ephemeral: true });
                } else {
                    await userMember.roles.remove(roleinter);
                    return interaction.reply({ content: 'The user has no role', ephemeral: true });
                }
            }

        } else if (interaction.member.roles.cache.has(client.jobs.TAXI.HO)) {

            const option = await interaction.options.getString("gr-option");
            const JobName = client.jobs.TAXI.NAME;

            if (option === 'gr-interview') {
                const role = interaction.guild.roles.cache.get(client.jobs.TAXI.INTERVIEW);
                if (!role) {
                    return interaction.reply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
                }
                if (userMember.roles.cache.has(role.id)) {
                    return interaction.reply({ content: 'The user already has the role', ephemeral: true });
                } else {
                    await userMember.roles.add(role);
                    await RoleLog(JobName, option, userMember.id, interaction.user.id);
                    return interaction.reply({ content: `Interview Role Added! <@${userMember.id}>`, ephemeral: true });
                }
            }

            if (option === 'gr-job') {
                const role = interaction.guild.roles.cache.get(client.jobs.TAXI.ROLEID);
                if (!role) {
                    return interaction.reply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
                }
                const roleinter = interaction.guild.roles.cache.get(client.jobs.TAXI.INTERVIEW);
                if (!roleinter) {
                    return interaction.reply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
                }
                if (userMember.roles.cache.has(role.id)) {
                    return interaction.reply({ content: 'The user already has the role', ephemeral: true });
                } else {
                    await userMember.roles.add(role);
                    await userMember.roles.remove(roleinter);
                    await RoleLog(JobName, option, userMember.id, interaction.user.id);
                    return interaction.reply({ content: `TAXI Role Added! <@${userMember.id}>`, ephemeral: true });
                }
            }

            if (option === 'gr-remove') {
                const role = interaction.guild.roles.cache.get(client.jobs.TAXI.ROLEID);
                if (!role) {
                    return interaction.reply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
                }
                const roleinter = interaction.guild.roles.cache.get(client.jobs.TAXI.INTERVIEW);
                if (!roleinter) {
                    return interaction.reply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
                }
                const rolecool = interaction.guild.roles.cache.get(client.jobs.GOVTCOOL);
                if (!rolecool) {
                    return interaction.reply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
                }
                if (userMember.roles.cache.has(role.id)) {
                    await userMember.roles.add(rolecool);
                    await userMember.roles.remove(role);
                    await userMember.roles.remove(roleinter);
                    await RoleLog(JobName, option, userMember.id, interaction.user.id);
                    return interaction.reply({ content: `TAXI Role Removed! <@${userMember.id}>`, ephemeral: true });
                } else {
                    await userMember.roles.remove(roleinter);
                    return interaction.reply({ content: 'The user has no role', ephemeral: true });
                }
            }

        } else if (interaction.member.roles.cache.has(client.jobs.MEDIA.HO)) {

            const option = await interaction.options.getString("gr-option");
            const JobName = client.jobs.MEDIA.NAME;

            if (option === 'gr-interview') {
                const role = interaction.guild.roles.cache.get(client.jobs.MEDIA.INTERVIEW);
                if (!role) {
                    return interaction.reply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
                }
                if (userMember.roles.cache.has(role.id)) {
                    return interaction.reply({ content: 'The user already has the role', ephemeral: true });
                } else {
                    await userMember.roles.add(role);
                    await RoleLog(JobName, option, userMember.id, interaction.user.id);
                    return interaction.reply({ content: `Interview Role Added! <@${userMember.id}>`, ephemeral: true });
                }
            }

            if (option === 'gr-job') {
                const role = interaction.guild.roles.cache.get(client.jobs.MEDIA.ROLEID);
                if (!role) {
                    return interaction.reply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
                }
                const roleinter = interaction.guild.roles.cache.get(client.jobs.MEDIA.INTERVIEW);
                if (!roleinter) {
                    return interaction.reply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
                }
                if (userMember.roles.cache.has(role.id)) {
                    return interaction.reply({ content: 'The user already has the role', ephemeral: true });
                } else {
                    await userMember.roles.add(role);
                    await userMember.roles.remove(roleinter);
                    await RoleLog(JobName, option, userMember.id, interaction.user.id);
                    return interaction.reply({ content: `MEDIA Role Added! <@${userMember.id}>`, ephemeral: true });
                }
            }

            if (option === 'gr-remove') {
                const role = interaction.guild.roles.cache.get(client.jobs.MEDIA.ROLEID);
                if (!role) {
                    return interaction.reply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
                }
                const roleinter = interaction.guild.roles.cache.get(client.jobs.MEDIA.INTERVIEW);
                if (!roleinter) {
                    return interaction.reply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
                }
                const rolecool = interaction.guild.roles.cache.get(client.jobs.GOVTCOOL);
                if (!rolecool) {
                    return interaction.reply({ content: 'The specified role does not exist in this guild.', ephemeral: true });
                }
                if (userMember.roles.cache.has(role.id)) {
                    await userMember.roles.add(rolecool);
                    await userMember.roles.remove(role);
                    await userMember.roles.remove(roleinter);
                    await RoleLog(JobName, option, userMember.id, interaction.user.id);
                    return interaction.reply({ content: `MEDIA Role Removed! <@${userMember.id}>`, ephemeral: true });
                } else {
                    await userMember.roles.remove(roleinter);
                    return interaction.reply({ content: 'The user has no role', ephemeral: true });
                }
            }

        } else {
            return interaction.reply({ content: 'You Are Not Authorized!', ephemeral: true });
        }
    }
};