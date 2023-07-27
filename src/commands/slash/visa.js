const {
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {
    cooldown: 10000,
    userPerms: [],
    botPerms: [],

    data: new SlashCommandBuilder()
        .setName('visa')
        .setDescription('Visa messages')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addStringOption(option =>
            option.setName('type')
                .setDescription('VP Status')
                .setRequired(true)
                .addChoices(
                    { name: 'Form Accepted', value: 'form-accepted' },
                    { name: 'Form/VP Denied', value: 'form-denied' },
                    { name: 'Visa Approved', value: 'visa-accepted' },
                    { name: 'Visa Onhold', value: 'visa-onhold' },
                ))
        .addNumberOption(option =>
            option.setName('application-id')
                .setDescription('User Application ID')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('user-name')
                .setDescription('VP user\'s Name')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('rejected-reason')
                .setDescription('VP user\'s rejection reason')
                .setRequired(false)),

    async execute(interaction, client) {

        const commandName = "VISA";
        client.std_log.error(client, commandName, interaction.user.id, interaction.channel.id);

        async function Roles(user, role, roleId) {
            const info = await interaction.guild.members.fetch(user.id);
            const roleInfo = await interaction.guild.roles.cache.find(x => x.id === roleId);
            if (role === 'add') {
                await info.roles.add(roleInfo);
            } else if (role === 'remove') {
                await info.roles.remove(roleInfo);
            }
        }

        const options = interaction.options.getString("type");
        const appNo = interaction.options.getNumber("application-id");
        const user = interaction.options.getUser("user-name");
        const userMember = await interaction.guild.members.cache.get(user.id);

        if (!userMember) return interaction.reply({ content: "User not found! (Maybe left the server)", ephemeral: true });
        if (userMember.roles.cache.has(client.visa.VISA.ROLEID1)) return interaction.reply({ content: "The user already has VISA Holder Role!", ephemeral: true });
        if (!userMember.roles.cache.has(client.visa.VISA.ROLEID2)) return interaction.reply({ content: "The user has no Community Role!", ephemeral: true });
        if (user.id === client.user.id) return interaction.reply({ content: "Men ... you cannot give me visa! 😂", ephemeral: true });
        if (user.bot) return interaction.reply({ content: "Cannot mention other bots.", ephemeral: true });

        await interaction.deferReply({ ephemeral: true });

        if (options === 'form-accepted') {

            const vpChan = client.channels.cache.get(client.visa.ACCEPTED.VPCHAN);
            await vpChan.send({
                content: `**Application No: ${appNo.toString()}** | Congratulations, <@${user.id}>! Your server whitelist form has been accepted, and we are pleased to welcome you to ICONIC Roleplay. To continue with your registration, please contact our Immigration Officers to attend the mandatory voice process, which takes place daily.`
            }).then(async (msg) => {
                await Roles(user, 'add', client.visa.ACCEPTED.ROLEID);
                var msgLink = msg.url;

                const DMembed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setThumbnail(client.visa.LOGO)
                    .setTitle(`Iconic Voice Process`)
                    .setDescription(`<@${user.id}>, your **Voice Process Application** has been accepted 😊! Kindly join the <#${client.visa.ACCEPTED.WAITING_HALL}>`)
                const DMbutton = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel(`Message`)
                            .setEmoji('📑')
                            .setStyle(ButtonStyle.Link)
                            .setURL(msgLink)
                    )
                client.users.cache.get(user.id).send({ embeds: [DMembed], components: [DMbutton] }).catch(error => {
                    if (error.code == 50007) {
                        const logembed = new EmbedBuilder()
                            .setColor('#000000')
                            .setDescription(`Unable to DM <@${user.id}> (VP Form Accept)`)
                        client.channels.cache.get(client.visa.ACCEPTED.LOGCHAN).send({ embeds: [logembed] });
                    } else { console.error(error); }
                });

                const logembed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setDescription('Visa-FORM-ACCEPTED')
                    .addFields(
                        { name: 'User', value: `<@${interaction.user.id}>` },
                        { name: 'Client', value: `<@${user.id}>` }
                    )
                client.channels.cache.get(client.visa.ACCEPTED.LOGCHAN).send({ embeds: [logembed] });
                return await interaction.editReply({ content: "Sent!", ephemeral: true });
            });

        } else if (options === 'form-denied') {

            const reason = interaction.options.getString("rejected-reason") || null;
            if (!reason) return interaction.editReply({ content: 'Visa Denied Reason Missing!', ephemeral: true });

            const vpChan = client.channels.cache.get(client.visa.REJECTED.REJCHAN);
            await vpChan.send({
                content: `**Application No: ${appNo.toString()}** | <@${user.id}> Your Server Whitelist form has been **Rejected**.\n\`\`\`${reason}\`\`\``
            }).then(async (msg) => {

                var msgLink = msg.url;
                await Roles(user, 'remove', client.visa.ACCEPTED.ROLEID);
                await Roles(user, 'remove', client.visa.HOLD.ROLEID);

                const DMembed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setThumbnail(client.visa.LOGO)
                    .setTitle(`Iconic Voice Process`)
                    .setDescription(`<@${user.id}>, your **Voice Process Application** has been rejected 😓! Kindly reapply after 48 hours <#${client.visa.REJECTED.APPLYCHAN}>\nServer Rules: <#${client.visa.REJECTED.RULECHAN}>`)
                const DMbutton = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel(`Message`)
                            .setEmoji('📑')
                            .setStyle(ButtonStyle.Link)
                            .setURL(msgLink)
                    )

                client.users.cache.get(user.id).send({ embeds: [DMembed], components: [DMbutton] }).catch(error => {
                    if (error.code == 50007) {
                        const logembed = new EmbedBuilder()
                            .setColor('#000000')
                            .setDescription(`Unable to DM <@${user.id}> (VP Form Rejected)`)
                        client.channels.cache.get(client.visa.REJECTED.LOGCHAN).send({ embeds: [logembed] });
                    } else { console.error(error); }
                });
            });

            const logembed = new EmbedBuilder()
                .setColor('#00FF00')
                .setDescription('Visa-FORM/VP-REJECTED')
                .addFields(
                    { name: 'User', value: `<@${interaction.user.id}>` },
                    { name: 'Client', value: `<@${user.id}>` }
                )
            client.channels.cache.get(client.visa.REJECTED.LOGCHAN).send({ embeds: [logembed] });
            return await interaction.editReply({ content: "Sent!", ephemeral: true });

        } else if (options === 'visa-accepted') {

            const vpChan = client.channels.cache.get(client.visa.VISA.VISACHAN);
            await vpChan.send({
                content: `**Application No: ${appNo.toString()}** | <@${user.id}> **Congratulations on your acceptance to Iconic Roleplay! We're thrilled to have you as part of our community and can't wait to see what kind of exciting roleplaying experiences you'll bring to the table. Welcome aboard!**\n\n**If you have any questions or concerns, don't hesitate to tag our moderators or admins. We are here to ensure your experience is as enjoyable as possible.**\nPlease do visit ⁠<#1097103352640307210> and verify your age 😇\n\n**----------------------------------------------**`
            }).then(async (msg) => {
                var msgLink = msg.url;
                await Roles(user, 'add', client.visa.VISA.ROLEID1);
                await Roles(user, 'remove', client.visa.ACCEPTED.ROLEID);
                await Roles(user, 'remove', client.visa.VISA.ROLEID2);
                await Roles(user, 'remove', client.visa.HOLD.ROLEID);

                const DMembed = new EmbedBuilder()
                    .setColor('#0000FF')
                    .setThumbnail(client.visa.LOGO)
                    .setTitle(`Iconic Voice Process`)
                    .setDescription(`<@${user.id}>, Congratulations 🎊! Your **Visa has been approved**, Thanks for attending the Voice Process.\nFor further queries regarding login and connectivity, contact staffs in <#${client.visa.VISA.HELPCHAN}>`)
                const DMbutton = new ActionRowBuilder()
                    .addComponents(
                        /*new ButtonBuilder()
                            .setLabel(`FiveM Iconic Roleplay`)
                            .setEmoji('🔗')
                            .setStyle(ButtonStyle.Link)
                            .setURL(client.visa.CONNECT)
                            .setDisabled(true),*/
                        new ButtonBuilder()
                            .setLabel(`Message`)
                            .setEmoji('📑')
                            .setStyle(ButtonStyle.Link)
                            .setURL(msgLink)
                    )

                client.users.cache.get(user.id).send({ embeds: [DMembed], components: [DMbutton] }).catch(error => {
                    if (error.code == 50007) {
                        const logembed = new EmbedBuilder()
                            .setColor('#000000')
                            .setDescription(`Unable to DM <@${user.id}> (Visa Approved)`)
                        client.channels.cache.get(client.visa.VISA.LOGCHAN).send({ embeds: [logembed] });
                    } else { console.error(error); }
                });

                const logembed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setDescription('VISA-ACCEPTED')
                    .addFields(
                        { name: 'User', value: `<@${interaction.user.id}>` },
                        { name: 'Client', value: `<@${user.id}>` }
                    )
                client.channels.cache.get(client.visa.ACCEPTED.LOGCHAN).send({ embeds: [logembed] });
                return await interaction.editReply({ content: "Sent!", ephemeral: true });
            });


        } else if (options === 'visa-onhold') {

            const vpChan = client.channels.cache.get(client.visa.HOLD.HOLDCHAN);
            await vpChan.send({
                content: `**Application No: ${appNo.toString()}** | Dear <@${user.id}>, Thank you for participating in the voice process, we appreciate your time and effort! We kindly ask you to take a moment to review the rules, as we want to ensure that you have a great Role Play experience. Once you've done that, please feel free to attend the voice process again - we're excited to hear your improved answers and help you get started on your Role Play journey.`
            }).then(async (msg) => {
                var msgLink = msg.url;
                await Roles(user, 'add', client.visa.HOLD.ROLEID);

                const DMembed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setThumbnail(client.visa.LOGO)
                    .setTitle(`Iconic Voice Process`)
                    .setDescription(`<@${user.id}>, Your visa application is **on Hold** 😔. Kindly read the rules <#${client.visa.HOLD.RULECHAN}> and attend the next voice process.`)
                const DMbutton = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel(`Message`)
                            .setEmoji('📑')
                            .setStyle(ButtonStyle.Link)
                            .setURL(msgLink)
                    )
                client.users.cache.get(user.id).send({ embeds: [DMembed], components: [DMbutton] }).catch(error => {
                    if (error.code == 50007) {
                        const logembed = new EmbedBuilder()
                            .setColor('#000000')
                            .setDescription(`Unable to DM <@${user.id}> (VP On Hold)`)

                        client.channels.cache.get(client.visa.HOLD.LOGCHAN).send({ embeds: [logembed] });
                    } else { console.error(error); }
                });

                const logembed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setDescription('VISA-ONHOLD')
                    .addFields(
                        { name: 'User', value: `<@${interaction.user.id}>` },
                        { name: 'Client', value: `<@${user.id}>` }
                    )
                client.channels.cache.get(client.visa.HOLD.LOGCHAN).send({ embeds: [logembed] });
                return await interaction.editReply({ content: "Sent!", ephemeral: true });
            });

        } else {
            return interaction.editReply({ content: '**Internal Error** | Contact Developer', ephemeral: true });
        }
    }
}