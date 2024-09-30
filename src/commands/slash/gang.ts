import { AutocompleteInteraction, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, User, ColorResolvable, DiscordAPIError, Attachment, TextChannel } from "discord.js";
import ValidateColor from "../../utils/validate/colors";
import GangInitSchema from "../../events/database/schema/gangInit";
import { client } from "../../bot";
import { IGangInit, SlashCommand, GangWarLocation } from "../../types";

const command: SlashCommand = {
    cooldown: 5000,
    owner: false,
    data: new SlashCommandBuilder()
        .setName("gang")
        .setDescription("Manage your gang.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("create")
                .setDescription("Create a gang.")
                .addStringOption(option =>
                    option
                        .setName("name")
                        .setDescription("Name of the gang.")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("color")
                        .setDescription("Color of the gang.")
                        .setRequired(true)
                )
                .addAttachmentOption(option =>
                    option
                        .setName("logo")
                        .setDescription("Logo of the gang (PNG, JPG, or JPEG).")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("invite")
                .setDescription("Invite a user to your gang.")
                .addUserOption(option =>
                    option
                        .setName("user")
                        .setDescription("DM the user to invite.")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("kick")
                .setDescription("Kick a user from your gang.")
                .addUserOption(option =>
                    option
                        .setName("user")
                        .setDescription("User to kick.")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("status")
                .setDescription("View your gang status.")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("edit")
                .setDescription("Edit your gang.")
                .addStringOption(option =>
                    option
                        .setName("name")
                        .setDescription("Name of the gang.")
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option
                        .setName("color")
                        .setDescription("Color of the gang.")
                        .setRequired(false)
                )
                .addAttachmentOption(option =>
                    option
                        .setName("logo")
                        .setDescription("Logo of the gang (PNG, JPG, or JPEG).")
                        .setRequired(false)
                )

        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("leader")
                .setDescription("Transfer gang leadership.")
                .addUserOption(option =>
                    option
                        .setName("user")
                        .setDescription("User to transfer leadership.")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("disband")
                .setDescription("Disband your gang (Need admin approval!).")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("leave")
                .setDescription("Leave/Retire from your gang.")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("location")
                .setDescription("Select gang location (Admin only).")
                .addStringOption(option =>
                    option
                        .setName("gang")
                        .setDescription("The gang to set the location for.")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option
                        .setName("location")
                        .setDescription("The location to set for the gang.")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove_location")
                .setDescription("Remove a gang location (Admin only).")
                .addStringOption(option =>
                    option
                        .setName("gang")
                        .setDescription("The gang to remove the location from.")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option
                        .setName("location")
                        .setDescription("The location to remove from the gang.")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ),

    async autocomplete(interaction: AutocompleteInteraction) {
        try {
            const focusedOption = interaction.options.getFocused(true);
            let choices: { name: string; value: string }[] = [];

            if (focusedOption.name === "gang") {
                const gangs = await GangInitSchema.find({});
                choices = gangs.map(gang => ({ name: gang.gangName, value: gang.gangName }));
            }
            else if (focusedOption.name === "location") {
                const gangName = interaction.options.getString("gang");

                if (gangName) {
                    const gangData = await GangInitSchema.findOne({ gangName: gangName });
                    if (gangData) {
                        if (interaction.options.getSubcommand() === "remove_location") {
                            const currentLocations = gangData.gangLocation || [];
                            choices = currentLocations.map(location => {
                                const locationInfo = client.config.gang.war.location.find((loc: GangWarLocation) => loc.value === location);
                                return {
                                    name: locationInfo ? `${locationInfo.name} ${locationInfo.emoji}` : location,
                                    value: location
                                };
                            });
                        } else if (interaction.options.getSubcommand() === "location") {
                            const allGangs = await GangInitSchema.find({});
                            const takenLocations = allGangs.flatMap(gang => gang.gangLocation || []);
                            const availableLocations = client.config.gang.war.location.filter((loc: GangWarLocation) =>
                                !takenLocations.includes(loc.value)
                            );
                            choices = availableLocations.map((location: GangWarLocation) => ({
                                name: `${location.name} ${location.emoji}`,
                                value: location.value
                            }));
                        }
                    }
                }
            }

            const filtered = choices.filter(choice =>
                choice.name.toLowerCase().includes(focusedOption.value.toLowerCase())
            );
            await interaction.respond(filtered.slice(0, 25));
        } catch (error) {
            client.logger.error("Error in autocomplete function:", error);
            await interaction.respond([{ name: "Error occurred", value: "error" }]);
        }
    },
    async execute(interaction, client) {

        const sendEditApprovalRequest = async (gangData: IGangInit, newName: string | null, newColor: string | null, newLogo: string | null) => {
            const adminChannel = await client.channels.fetch(client.config.bot.adminChannel) as TextChannel;
            if (!adminChannel) {
                throw new Error("Admin channel not found");
            }

            const gangId = gangData._id as string | number;

            const embed = new EmbedBuilder()
                .setTitle("Gang Edit Request")
                .setColor((newColor || gangData.gangColor) as ColorResolvable)
                .setDescription(`Gang ${gangData.gangName} has requested to edit their information.`)
                .addFields(
                    { name: "Leader", value: `<@${gangData.gangLeader}>`, inline: true },
                    { name: "Current Name", value: gangData.gangName, inline: true },
                    { name: "Current Color", value: gangData.gangColor, inline: true },
                    { name: "New Name", value: newName || "No change", inline: true },
                    { name: "New Color", value: newColor || "No change", inline: true },
                    { name: "New Logo", value: newLogo || "No change", inline: true }
                )
                .setFooter({ text: gangId.toString() });

            if (gangData.gangLogo) {
                embed.setThumbnail(gangData.gangLogo);
            }

            if (newLogo && newLogo !== "No change") {
                embed.setImage(newLogo);
            }

            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('approve-gang-edit')
                        .setLabel('Approve')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('reject-gang-edit')
                        .setLabel('Reject')
                        .setStyle(ButtonStyle.Danger)
                );

            await adminChannel.send({ embeds: [embed], components: [row] });
        };

        const notifyAdminChannel = async (gangData: IGangInit) => {
            const adminChannel = await client.channels.fetch(client.config.bot.adminChannel) as TextChannel;
            if (adminChannel && adminChannel.isTextBased()) {

                const embed = new EmbedBuilder()
                    .setTitle("New Gang Created")
                    .setColor(gangData.gangColor as ColorResolvable)
                    .setDescription(`A new gang has been created and is pending approval.`)
                    .addFields(
                        { name: "Gang Name", value: gangData.gangName, inline: true },
                        { name: "Leader", value: `<@${gangData.gangLeader}>`, inline: true },
                        { name: "Gang Color", value: gangData.gangColor, inline: true },
                        { name: "Gang Leader ID", value: gangData.gangLeader, inline: true }
                    )
                    .setThumbnail(gangData.gangLogo);

                const row = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('approve-gang')
                            .setLabel('Approve')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('reject-gang')
                            .setLabel('Reject')
                            .setStyle(ButtonStyle.Danger)
                    );

                await adminChannel.send({ embeds: [embed], components: [row] });
            }
        };

        const createGang = async (name: string, color: string, logo: Attachment) => {

            let gangData = await GangInitSchema.findOne({ gangLeader: interaction.user.id });
            if (gangData) {
                return "Cannot create a gang, you are already a leader of a gang.";
            }

            gangData = await GangInitSchema.findOne({ "gangMembers.userId": interaction.user.id });
            if (gangData) {
                return "Cannot create a gang, you are already a member of a gang.";
            }

            const nameRegex = /^[a-zA-Z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]{3,20}$/;
            if (!name.match(nameRegex)) {
                return "Name should be 3-20 characters long and can contain letters, numbers, spaces, and common special characters.";
            }
            gangData = await GangInitSchema.findOne({ gangName: name });
            if (gangData) {
                return "Name already exists.";
            }

            const convertedColor = ValidateColor(color);
            if (!convertedColor) {
                return "Invalid color. Please provide a valid color name, hex code, RGB, or HSL value.";
            }
            gangData = await GangInitSchema.findOne({ gangColor: convertedColor });
            if (gangData) {
                return "Color already exists.";
            }

            const maxSize = 8 * 1024 * 1024;
            if (logo.size > maxSize) {
                return "Logo file size must be less than 8MB.";
            }

            const allowedExtensions = ['.png', '.jpg', '.jpeg'];
            const fileExtension = logo.name?.toLowerCase().slice(logo.name.lastIndexOf('.'));
            if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
                return "Logo must be a PNG, JPG, or JPEG file.";
            }

            const logoUrl = logo.url;

            gangData = new GangInitSchema({
                gangName: name,
                gangColor: convertedColor,
                gangLogo: logoUrl,
                gangLeader: interaction.user.id,
                gangRole: "None",
                gangMembers: [{
                    userId: interaction.user.id,
                    gangJoinDate: new Date()
                }],
                gangCreated: new Date(),
                gangStatus: false
            });

            await gangData.save();
            await notifyAdminChannel(gangData);
            return `Gang ${name} created successfully.`;
        };

        const inviteUser = async (user: User) => {
            try {
                let gangData = await GangInitSchema.findOne({ gangLeader: interaction.user.id });
                if (!gangData) {
                    return "Cannot invite a user, you are not a leader of any gang.";
                }

                if (!gangData.gangStatus) {
                    return "Cannot invite users, your gang is not yet approved by admins.";
                }

                const targetUserGang = await GangInitSchema.findOne({
                    $or: [
                        { "gangMembers.userId": user.id },
                        { gangLeader: user.id }
                    ]
                });
                if (targetUserGang) {
                    return "Cannot invite this user, they are already a member or leader of a gang.";
                }

                if (user.bot) {
                    return "Cannot invite a bot to the gang.";
                }

                const member = interaction.guild?.members.cache.get(user.id);
                if (member?.permissions.has(PermissionFlagsBits.Administrator)) {
                    return "Cannot invite an Administrator to the gang.";
                }

                if (gangData.gangMembers.length >= 25) {
                    return "Cannot invite more members, gang is full.";
                }

                const inviteEmbed = new EmbedBuilder()
                    .setTitle("Gang Invitation")
                    .setColor(gangData.gangColor as ColorResolvable)
                    .setDescription(`You've been invited to join a gang!`)
                    .addFields(
                        { name: "Gang Name", value: gangData.gangName, inline: true },
                        { name: "Gang Leader", value: `<@${gangData.gangLeader}>`, inline: true },
                        { name: "Members", value: gangData.gangMembers.length.toString(), inline: true }
                    )
                    .setThumbnail(gangData.gangLogo);

                const row = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('accept-gang-offer')
                            .setLabel('Accept')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('reject-gang-offer')
                            .setLabel('Reject')
                            .setStyle(ButtonStyle.Danger)
                    );

                let sentInvite;
                try {
                    sentInvite = await user.send({ embeds: [inviteEmbed], components: [row] });
                } catch (error) {
                    if (error instanceof DiscordAPIError && error.code === 50007) {
                        client.logger.warn(`Unable to send invitation to ${user.username}. They may have DMs disabled or have blocked the bot.`);
                        return `Unable to send invitation to ${user.username}. They may have DMs disabled or have blocked the bot.`;
                    } else {
                        throw error;
                    }
                }

                const collector = sentInvite.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: 15 * 60 * 1000 // 15 minutes
                });

                collector.on('collect', async (i) => {
                    if (i.user.id === user.id) {
                        try {
                            if (i.customId === 'accept-gang-offer') {

                                const updatedGangData = await GangInitSchema.findOne({ gangLeader: interaction.user.id });
                                if (!updatedGangData || updatedGangData.gangMembers.length >= 25) {
                                    await i.update({ content: "Sorry, the gang is no longer available or is full.", components: [] });
                                    return;
                                }

                                const existingMember = updatedGangData.gangMembers.find(member => member.userId === user.id);
                                if (existingMember) {
                                    await i.update({ content: "You've already joined the gang.", components: [] });
                                    return;
                                }

                                gangData.gangMembers.push({
                                    userId: user.id,
                                    gangJoinDate: new Date()
                                });
                                await gangData.save();

                                const role = interaction.guild?.roles.cache.get(updatedGangData.gangRole);
                                if (role) {
                                    try {
                                        await interaction.guild?.members.cache.get(user.id)?.roles.add(role);
                                    } catch (roleError) {
                                        client.logger.error("Error adding role to user:", roleError);
                                    }
                                }

                                await i.update({ content: "You've accepted the invitation!", components: [] });
                                await interaction.followUp({ content: `${user.username} has accepted your gang invitation!`, ephemeral: true }).catch(() => { });
                            } else if (i.customId === 'reject-gang-offer') {
                                await i.update({ content: "You've rejected the invitation.", components: [] });
                                await interaction.followUp({ content: `${user.username} has rejected your gang invitation.`, ephemeral: true }).catch(() => { });
                            }
                        } catch (error) {
                            client.logger.error("Error processing gang invitation response:", error);
                            await i.update({ content: "An error occurred while processing your response.", components: [] });
                        }
                        collector.stop();
                    }
                });

                collector.on('end', async (collected, reason) => {
                    if (reason === 'time') {
                        await sentInvite.edit({ content: "This invitation has expired.", components: [] });
                        try {
                            const gangLeader = await client.users.fetch(interaction.user.id);
                            await gangLeader.send(`The invitation to ${user.username} has expired.`);
                        } catch (error) {
                            client.logger.error("Error sending expiration notification:", error);
                        }
                    }
                });

                return `Invitation sent to ${user.username}. Waiting for their response...`;
            } catch (error) {
                client.logger.error("Error in inviteUser function:", error);
                return `An error occurred while inviting ${user.username}. Please try again later.`;
            }
        };

        const kickUser = async (user: User) => {
            const gangData = await GangInitSchema.findOne({
                gangLeader: interaction.user.id,
                "gangMembers.userId": user.id
            });

            if (!gangData || !gangData.gangStatus) {
                return "Cannot kick this user. Either you are not the gang leader, the user is not a member of your gang, or your gang is not approved.";
            }

            gangData.gangMembers = gangData.gangMembers.filter(member => member.userId !== user.id);
            await gangData.save();

            const role = interaction.guild?.roles.cache.get(gangData.gangRole);
            if (role) {
                await interaction.guild?.members.cache.get(user.id)?.roles.remove(role);
            }

            return `User ${user.username} kicked successfully.`;
        };

        const viewStatus = async () => {
            let gangData = await GangInitSchema.findOne({
                $or: [
                    { gangLeader: interaction.user.id },
                    { "gangMembers.userId": interaction.user.id }
                ]
            });

            if (!gangData || !gangData.gangStatus) {
                return "Cannot edit the gang. Either you are not a leader of any gang or your gang is not approved.";
            }

            const embed = new EmbedBuilder()
                .setTitle(`Gang: ${gangData.gangName}`)
                .setColor(gangData.gangColor as ColorResolvable)
                .setThumbnail(gangData.gangLogo)
                .addFields(
                    { name: "Leader", value: `<@${gangData.gangLeader}>`, inline: true },
                    { name: 'Total Members', value: gangData.gangMembers.length.toString(), inline: true },
                    { name: "Created", value: gangData.gangCreated.toDateString(), inline: true },
                    { name: "Status", value: gangData.gangStatus ? "Active" : "Inactive", inline: true },
                    { name: "Members", value: gangData.gangMembers.map(member => `<@${member.userId}>`).join(", ") }
                );

            return { embeds: [embed] };
        };

        const editGang = async (name: string | null, color: string | null, logo: Attachment | null) => {
            let gangData = await GangInitSchema.findOne({ gangLeader: interaction.user.id });
            if (!gangData) {
                return "Cannot edit the gang, you are not a leader of any gang.";
            }

            if (!gangData.gangStatus) {
                return "Cannot edit the gang, your gang is not yet approved by admins.";
            }

            let newName = null;
            let newColor = null;
            let newLogo = null;

            if (name) {
                const nameRegex = /^[a-zA-Z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]{3,20}$/;
                if (!name.match(nameRegex)) {
                    return "Name should be 3-20 characters long and can contain letters, numbers, spaces, and common special characters.";
                }
                newName = name;
            }

            if (color) {
                const convertedColor = ValidateColor(color);
                if (!convertedColor) {
                    return "Invalid color. Please provide a valid color name, hex code, RGB, or HSL value.";
                }
                newColor = convertedColor;
            }

            if (logo) {
                const maxSize = 8 * 1024 * 1024;
                if (logo.size > maxSize) {
                    return "Logo file size must be less than 8MB.";
                }

                const allowedExtensions = ['.png', '.jpg', '.jpeg'];
                const fileExtension = logo.name?.toLowerCase().slice(logo.name.lastIndexOf('.'));
                if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
                    return "Logo must be a PNG, JPG, or JPEG file.";
                }
                newLogo = logo.url;
            }

            if (!newName && !newColor && !newLogo) {
                return "No changes requested.";
            }

            try {
                await sendEditApprovalRequest(gangData, newName, newColor, newLogo);
                return "Edit request sent to admins. Please wait for approval.";
            } catch (error) {
                client.logger.error("Error sending edit approval request:", error);
                return "An error occurred while sending the edit request. Please try again later.";
            }
        };

        const transferLeader = async (user: User) => {

            if (user.bot) {
                return "Cannot transfer leadership to a bot.";
            }

            if (user.id === interaction.user.id) {
                return "Cannot transfer leadership to yourself.";
            }

            const gangData = await GangInitSchema.findOne({ gangLeader: interaction.user.id });
            if (!gangData) {
                return "Cannot transfer leadership, you are not a leader of any gang.";
            }
            if (!gangData.gangStatus) {
                return "Cannot transfer leadership, your gang is not yet approved by admins.";
            }

            const targetUserGang = await GangInitSchema.findOne({
                "gangMembers.userId": user.id,
                _id: gangData._id
            });
            if (!targetUserGang) {
                return "Cannot transfer leadership, the target user is not a member of your gang.";
            }

            const transferEmbed = new EmbedBuilder()
                .setTitle("Gang Leadership Transfer")
                .setColor(gangData.gangColor as ColorResolvable)
                .setDescription(`You've been offered the leadership of the gang!`)
                .addFields(
                    { name: "Gang Name", value: gangData.gangName, inline: true },
                    { name: "Current Leader", value: `<@${gangData.gangLeader}>`, inline: true },
                    { name: "Members", value: gangData.gangMembers.length.toString(), inline: true }
                )
                .setThumbnail(gangData.gangLogo);

            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('accept-gang-leader')
                        .setLabel('Accept')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('reject-gang-leader')
                        .setLabel('Reject')
                        .setStyle(ButtonStyle.Danger)
                );

            let sentInvite;

            try {
                sentInvite = await user.send({ embeds: [transferEmbed], components: [row] });

            } catch (error) {
                if (error instanceof DiscordAPIError && error.code === 50007) {
                    client.logger.warn(`Unable to send leadership transfer to ${user.username}. They may have DMs disabled or have blocked the bot.`);
                    return `Unable to send leadership transfer to ${user.username}. They may have DMs disabled or have blocked the bot.`;
                } else {
                    throw error;
                }
            }

            const collector = sentInvite.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 15 * 60 * 1000 // 15 minutes
            });

            return new Promise((resolve) => {
                collector.on('collect', async (i) => {
                    if (i.user.id === user.id) {
                        try {
                            if (i.customId === 'accept-gang-leader') {

                                gangData.gangLeader = user.id;
                                await gangData.save();

                                await i.update({ content: "You've accepted the leadership transfer!", components: [] });
                                resolve(`Leadership of ${gangData.gangName} has been transferred to ${user.username}.`);
                            } else if (i.customId === 'reject-gang-leader') {
                                await i.update({ content: "You've rejected the leadership transfer.", components: [] });
                                resolve(`${user.username} has rejected the leadership transfer.`);
                            }
                        } catch (error) {
                            client.logger.error("Error processing gang leadership transfer response:", error);
                            await i.update({ content: "An error occurred while processing your response.", components: [] });
                            resolve("An error occurred during the leadership transfer process.");
                        }
                        collector.stop();
                    }
                });

                collector.on('end', async (collected, reason) => {
                    if (reason === 'time') {
                        await sentInvite.edit({ content: "This leadership transfer offer has expired.", components: [] });
                        resolve("The leadership transfer offer has expired.");
                    }
                });
            });
        };

        const deleteGang = async () => {
            const gangData = await GangInitSchema.findOne({ gangLeader: interaction.user.id });
            if (!gangData) {
                return "Cannot delete the gang, you are not a leader of any gang.";
            }

            const adminChannel = await client.channels.fetch(client.config.bot.adminChannel) as TextChannel;
            if (!adminChannel) {
                return "Cannot disband the gang. Error \"404\" (Chan-012 not found)";
            }

            const gangId = gangData._id as string | number | null;
            if (!gangId) {
                return "Cannot disband the gang. Error \"404\" (Gang ID not found)";
            }

            const embed = new EmbedBuilder()
                .setTitle("Gang Disband Request")
                .setColor("Red")
                .setDescription(`Gang ${gangData.gangName} has requested to disband.`)
                .addFields(
                    { name: "Leader", value: `<@${gangData.gangLeader}>`, inline: true },
                    { name: "Members", value: gangData.gangMembers.length.toString(), inline: true },
                    { name: "Created", value: gangData.gangCreated.toDateString(), inline: true }
                )
                .setFooter({ text: gangId.toString() })
                .setThumbnail(gangData.gangLogo);

            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('approve-gang-disband')
                        .setLabel('Approve')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('reject-gang-disband')
                        .setLabel('Reject')
                        .setStyle(ButtonStyle.Danger)
                );

            await adminChannel.send({ embeds: [embed], components: [row] });
            return "Disband request sent to admins. Please wait for approval.";
        }

        const leaveGang = async () => {
            const gangData = await GangInitSchema.findOne({ "gangMembers.userId": interaction.user.id });
            if (!gangData) {
                return "Cannot leave the gang, you are not a member of any gang.";
            }

            if (gangData.gangLeader === interaction.user.id) {
                return "Cannot leave the gang, you are the leader of the gang. Disband the gang instead.";
            }

            const gangLeader = await client.users.fetch(gangData.gangLeader);
            const role = interaction.guild?.roles.cache.get(gangData.gangRole);
            if (role) {
                await interaction.guild?.members.cache.get(interaction.user.id)?.roles.remove(role);
            }

            gangData.gangMembers = gangData.gangMembers.filter(member => member.userId !== interaction.user.id);
            await gangData.save();

            await gangLeader.send(`User <@${interaction.user.id}> has left your gang ${gangData.gangName}.`);

            return `You've left the gang ${gangData.gangName}.`;
        };

        const setGangLocation = async (gangName: string, locationValue: string) => {
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
                return "You don't have permission to set gang locations.";
            }

            const gangData = await GangInitSchema.findOne({ gangName: gangName });
            if (!gangData) {
                return "Gang not found.";
            }

            const allGangs = await GangInitSchema.find({});
            const takenLocations = allGangs.flatMap(gang => gang.gangLocation || []);

            if (takenLocations.includes(locationValue)) {
                return `Location "${locationValue}" is already taken by another gang.`;
            }

            const selectedLocation = client.config.gang.war.location.find((loc: GangWarLocation) => loc.value === locationValue);
            if (!selectedLocation) {
                return "Invalid location selected.";
            }

            if (!gangData.gangLocation) {
                gangData.gangLocation = [];
            }
            gangData.gangLocation.push(selectedLocation.value);
            await gangData.save();

            return `Location added for ${gangName}: ${selectedLocation.name} ${selectedLocation.emoji}`;
        };

        const removeGangLocation = async (gangName: string, locationValue: string) => {
            if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
                return "You don't have permission to remove gang locations.";
            }

            const gangData = await GangInitSchema.findOne({ gangName: gangName });
            if (!gangData) {
                return "Gang not found.";
            }

            if (!gangData.gangLocation || !gangData.gangLocation.includes(locationValue)) {
                return "This gang doesn't have the specified location.";
            }

            gangData.gangLocation = gangData.gangLocation.filter(loc => loc !== locationValue);
            await gangData.save();

            const locationInfo = client.config.gang.war.location.find((loc: GangWarLocation) => loc.value === locationValue);
            return `Location removed from ${gangName}: ${locationInfo ? `${locationInfo.name} ${locationInfo.emoji}` : locationValue}`;
        };

        await interaction.deferReply();

        if (!client.config.gang.enabled) return await interaction.editReply("Gang feature is disabled.");
        if (!interaction.guild) return await interaction.editReply("This command can only be used in a server.");
        if (interaction.channel?.id !== client.config.gang.channel.create) return await interaction.editReply(`This command can only be used in <#${client.config.gang.channel.create}>.`);

        try {
            switch (interaction.options.getSubcommand()) {
                case "create": {
                    const name = interaction.options.getString("name", true);
                    const color = interaction.options.getString("color", true);
                    const logo = interaction.options.getAttachment("logo");

                    if (!logo) {
                        await interaction.editReply("Please provide a logo for your gang.");
                        return;
                    }

                    const response = await createGang(name, color, logo);
                    await interaction.editReply(response);
                    break;
                }
                case "invite": {
                    const user = interaction.options.getUser("user", true);

                    const response = await inviteUser(user);
                    await interaction.editReply(response);
                    break;
                }
                case "kick": {
                    const user = interaction.options.getUser("user", true);

                    const response = await kickUser(user);
                    await interaction.editReply(response);
                    break;
                }
                case "status": {
                    const response = await viewStatus();
                    await interaction.editReply(response);
                    break;
                }
                case "edit": {
                    const name = interaction.options.getString("name");
                    const color = interaction.options.getString("color");
                    const logo = interaction.options.getAttachment("logo");

                    const response = await editGang(name, color, logo);
                    await interaction.editReply(response);
                    break;
                }
                case "leader": {
                    const user = interaction.options.getUser("user", true);
                    const response = await transferLeader(user);
                    if (!response) return await interaction.editReply("An error occurred while processing your request.");
                    await interaction.editReply(response);
                    break;
                }
                case "disband": {
                    const response = await deleteGang();
                    await interaction.editReply(response);
                    break;
                }
                case "leave": {
                    const response = await leaveGang();
                    await interaction.editReply(response);
                    break;
                }
                case "location": {
                    const gangName = interaction.options.getString("gang", true);
                    const locationValue = interaction.options.getString("location", true);
                    const response = await setGangLocation(gangName, locationValue);
                    await interaction.editReply(response);
                    break;
                }
                case "remove_location": {
                    const gangName = interaction.options.getString("gang", true);
                    const locationValue = interaction.options.getString("location", true);
                    const response = await removeGangLocation(gangName, locationValue);
                    await interaction.editReply(response);
                    break;
                }
                default: {
                    await interaction.editReply("Invalid subcommand.");
                    break;
                }
            }
        } catch (error) {
            client.logger.error("Error in gang command:", error);
            await interaction.editReply("An error occurred while processing your request.");
        }
    }
};

export default command;