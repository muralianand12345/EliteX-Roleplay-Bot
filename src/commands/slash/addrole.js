const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const roleModel = require('../../events/mongodb/modals/roleremove.js');

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
        // Log
        const commandName = "ADDROLE";
        client.std_log.error(client, commandName, interaction.user.id, interaction.channel.id);

        await interaction.deferReply({ ephemeral: true });

        const userGR = interaction.options.getUser('gr-user');
        if (userGR.bot) return interaction.editReply({ content: 'Cannot give role to a bot!', ephemeral: true });

        const userMember = interaction.guild.members.cache.get(userGR.id);
        if (!userMember) return interaction.editReply({ content: 'No such user!', ephemeral: true });

        if (userMember.user.bot) return interaction.editReply({ content: 'The specified user is a bot!', ephemeral: true });

        const visaHolderRole = client.visa.VISA.ROLEID1;
        if (!userMember.roles.cache.has(visaHolderRole)) {
            return interaction.editReply({ content: "The user has no Visa Holder Role!", ephemeral: true });
        }

        async function RoleLog(job, type, toUserId, fromUserId) {
            const logEmbed = new EmbedBuilder()
                .setColor('#FFFFFF')
                .setDescription(`${job} | Type: ${type}`)
                .addFields(
                    { name: 'To', value: `<@${toUserId}>` },
                    { name: 'By', value: `<@${fromUserId}>` }
                );

            await client.channels.cache.get(client.jobs.LOG.CHANID).send({ embeds: [logEmbed] });
        }

        const roleMap = {
            PD: {
                HO: client.jobs.PD.HO,
                INTERVIEW: client.jobs.PD.INTERVIEW,
                ROLEID: client.jobs.PD.ROLEID,
                NAME: client.jobs.PD.NAME
            },
            EMS: {
                HO: client.jobs.EMS.HO,
                INTERVIEW: client.jobs.EMS.INTERVIEW,
                ROLEID: client.jobs.EMS.ROLEID,
                NAME: client.jobs.EMS.NAME
            },
            TAXI: {
                HO: client.jobs.TAXI.HO,
                INTERVIEW: client.jobs.TAXI.INTERVIEW,
                ROLEID: client.jobs.TAXI.ROLEID,
                NAME: client.jobs.TAXI.NAME
            },
            MEDIA: {
                HO: client.jobs.MEDIA.HO,
                INTERVIEW: client.jobs.MEDIA.INTERVIEW,
                ROLEID: client.jobs.MEDIA.ROLEID,
                NAME: client.jobs.MEDIA.NAME
            }
        };

        const selectedRole = Object.values(roleMap).find(role => interaction.member.roles.cache.has(role.HO));

        if (!selectedRole) return interaction.editReply({ content: 'You do not have the necessary role to use this command!', ephemeral: true });
        const rolecool = interaction.guild.roles.cache.get(client.jobs.GOVTCOOL);
        if (!rolecool) return interaction.editReply({ content: 'The specified role does not exist in this guild.', ephemeral: true });

        const grOption = interaction.options.getString('gr-option');
        const targetRole = roleMap[selectedRole.NAME];

        if (grOption === 'gr-interview') {
            if (userMember.roles.cache.has(targetRole.ROLEID)) return interaction.editReply({ content: "The user has the Job role", ephemeral: true });
            if (userMember.roles.cache.has(client.jobs.GOVTCOOL)) return interaction.editReply({ content: "The user has a Govt Job cooldown", ephemeral: true });
            if (userMember.roles.cache.has(targetRole.INTERVIEW)) return interaction.editReply({ content: "The user already has the Interview Role.", ephemeral: true });

            await RoleLog(targetRole.NAME, "Interview", userMember.id, interaction.user.id);
            await userMember.roles.add(targetRole.INTERVIEW);

            return interaction.editReply({ content: `Added Interview Role to <@${userMember.id}>!`, ephemeral: true });
        } else if (grOption === 'gr-job') {
            if (userMember.roles.cache.has(client.jobs.GOVTCOOL)) return interaction.editReply({ content: "The user has a Govt Job cooldown", ephemeral: true });
            if (userMember.roles.cache.has(targetRole.ROLEID)) return interaction.editReply({ content: "The user already has the Job Role!", ephemeral: true });
            //if (userMember.roles.cache.has(targetRole.INTERVIEW)) {
            await RoleLog(targetRole.NAME, "Job Role", userMember.id, interaction.user.id);
            await userMember.roles.add(targetRole.ROLEID);
            await userMember.roles.remove(targetRole.INTERVIEW);
            return interaction.editReply({ content: `Added Job Role to <@${userMember.id}>!`, ephemeral: true });
            /*} else {
                return interaction.editReply({ content: "The user no Interview role!", ephemeral: true });
            }*/

        } else if (grOption === 'gr-remove') {

            if (userMember.roles.cache.has(targetRole.ROLEID)) {
                const expirationDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
                const newRoleData = new roleModel({
                    userId: userMember.id,
                    roleId: rolecool.id,
                    expirationDate: expirationDate,
                    guildId: interaction.guild.id
                });
                await newRoleData.save();
                await userMember.roles.remove(targetRole.ROLEID);
                await userMember.roles.remove(targetRole.INTERVIEW);
                await userMember.roles.add(rolecool);
                await RoleLog(targetRole.NAME, "Role Removal", userMember.id, interaction.user.id);
                return interaction.editReply({ content: `Removed Role from <@${userMember.id}>!`, ephemeral: true });
            } else {
                return interaction.editReply({ content: `The user has no Job Role`, ephemeral: true });
            }
        }
    },
};
