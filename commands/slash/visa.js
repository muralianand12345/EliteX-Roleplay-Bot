const {
    SlashCommandBuilder,
    EmbedBuilder,
    ChannelType,
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
        const appNo = await interaction.options.getNumber("application-id");
        const user = await interaction.options.getUser("user-name");

        if (options === 'form-accepted') {
            
            await interaction.deferReply({ ephemeral: true });

            const vpChan = client.channels.cache.get(client.visa.ACCEPTED.VPCHAN);
            await vpChan.send({
                content: `**Application No: ${appNo.toString()}**, <@${user.id}> Your Server Whitelist form has been Accepted. **Welcome to ICONIC Roleplay**. Contact Immigration Officers to attend your voice process / Everyday there will be Voice Process.`
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

                client.users.cache.get(user.id).send({
                    embeds: [DMembed],
                    components: [DMbutton]
                }).catch(error => {
                    if (error.code == 50007) {
                        const logembed = new EmbedBuilder()
                            .setColor('#000000')
                            .setDescription(`Unable to DM <@${user.id}> (VP Form Accept)`)

                        return client.channels.cache.get(client.visa.ACCEPTED.LOGCHAN).send({
                            embeds: [logembed]
                        });
                    } else {
                        console.error(error);
                    }
                });

                await interaction.editReply({ content: "Sent!", ephemeral: true });

                const logembed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setDescription('Visa-FORM-ACCEPTED')
                    .addFields(
                        { name: 'User', value: `<@${interaction.user.id}>` },
                        { name: 'Client', value: `<@${user.id}>` }
                    )
                return client.channels.cache.get(client.visa.ACCEPTED.LOGCHAN).send({
                    embeds: [logembed]
                });
            });

        } else if (options === 'form-denied') {

            await interaction.deferReply({ ephemeral: true });
            const reason = interaction.options.getString("rejected-reason") || null;

            if (!reason) {
                return await interaction.editReply({ content: 'Visa Denied Reason Missing!', ephemeral: true });
            }

            const vpChan = client.channels.cache.get(client.visa.REJECTED.REJCHAN);

            await vpChan.send({
                content: `**Application No: ${appNo.toString()}**, <@${user.id}> Your Server Whitelist form has been **Rejected**.\n\`\`\`${reason}\`\`\``
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

                client.users.cache.get(user.id).send({
                    embeds: [DMembed],
                    components: [DMbutton]
                }).catch(error => {
                    if (error.code == 50007) {
                        const logembed = new EmbedBuilder()
                            .setColor('#000000')
                            .setDescription(`Unable to DM <@${user.id}> (VP Form Rejected)`)

                        return client.channels.cache.get(client.visa.REJECTED.LOGCHAN).send({
                            embeds: [logembed]
                        });
                    } else {
                        console.error(error);
                    }
                });
            });

            await interaction.editReply({ content: "Sent!", ephemeral: true });

            const logembed = new EmbedBuilder()
                .setColor('#00FF00')
                .setDescription('Visa-FORM/VP-REJECTED')
                .addFields(
                    { name: 'User', value: `<@${interaction.user.id}>` },
                    { name: 'Client', value: `<@${user.id}>` }
                )
            return client.channels.cache.get(client.visa.REJECTED.LOGCHAN).send({
                embeds: [logembed]
            });

        } else if (options === 'visa-accepted') {

            await interaction.deferReply({ ephemeral: true });

            const vpChan = client.channels.cache.get(client.visa.VISA.VISACHAN);

            await vpChan.send({
                content: `**Application No: ${appNo.toString()}**, <@${user.id}> **Congratulations on your acceptance to Iconic Roleplay! We're thrilled to have you as part of our community and can't wait to see what kind of exciting roleplaying experiences you'll bring to the table. Welcome aboard!**\n\n**If you have any questions or concerns, don't hesitate to tag our moderators or admins. We are here to ensure your experience is as enjoyable as possible.**\nPlease do visit ⁠<#1097103352640307210> and verify your age 😇\n\n**----------------------------------------------**`

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
                            .setLabel(`Connect Iconic Roleplay`)
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

                client.users.cache.get(user.id).send({
                    embeds: [DMembed],
                    components: [DMbutton]
                }).catch(error => {
                    if (error.code == 50007) {
                        const logembed = new EmbedBuilder()
                            .setColor('#000000')
                            .setDescription(`Unable to DM <@${user.id}> (Visa Approved)`)

                        return client.channels.cache.get(client.visa.VISA.LOGCHAN).send({
                            embeds: [logembed]
                        });
                    } else {
                        console.error(error);
                    }
                });

                await interaction.editReply({ content: "Sent!", ephemeral: true });

                const logembed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setDescription('VISA-ACCEPTED')
                    .addFields(
                        { name: 'User', value: `<@${interaction.user.id}>` },
                        { name: 'Client', value: `<@${user.id}>` }
                    )
                return client.channels.cache.get(client.visa.ACCEPTED.LOGCHAN).send({
                    embeds: [logembed]
                });
            });

        } else if (options === 'visa-onhold') {

            await interaction.deferReply({ ephemeral: true });
            
            const reason = interaction.options.getString("rejected-reason") || null;
            if (!reason) {
                return await interaction.editReply({ content: 'Visa Denied Reason Missing!', ephemeral: true });
            }

            const vpChan = client.channels.cache.get(client.visa.HOLD.HOLDCHAN);

            await vpChan.send({
                content: `**Application No: ${appNo.toString()}**, Dear <@${user.id}>  Thank you for taking your time in attending the voice process. We kindly request you to read the rules as your answers were not satisfying and attend the voice process once again.\n\`\`\`${reason}\`\`\``
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

                client.users.cache.get(user.id).send({
                    embeds: [DMembed],
                    components: [DMbutton]
                }).catch(error => {
                    if (error.code == 50007) {
                        const logembed = new EmbedBuilder()
                            .setColor('#000000')
                            .setDescription(`Unable to DM <@${user.id}> (VP On Hold)`)

                        return client.channels.cache.get(client.visa.HOLD.LOGCHAN).send({
                            embeds: [logembed]
                        });
                    } else {
                        console.error(error);
                    }
                });
                
                await interaction.editReply({ content: "Sent!", ephemeral: true });

                const logembed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setDescription('VISA-ONHOLD')
                    .addFields(
                        { name: 'User', value: `<@${interaction.user.id}>` },
                        { name: 'Client', value: `<@${user.id}>` }
                    )
                return client.channels.cache.get(client.visa.HOLD.LOGCHAN).send({
                    embeds: [logembed]
                });
            });

        } else {
            return await interaction.reply({ content: '**Internal Error** | Contact Developer', ephemeral: true });
        }
    }
}