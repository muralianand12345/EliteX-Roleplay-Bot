import { rgb } from 'color-convert';
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, User, ColorResolvable, DiscordAPIError, Attachment } from "discord.js";
import GangInitSchema from "../../events/database/schema/gangInit";
import { IGangInit, SlashCommand } from "../../types";
import { getNearestColor } from "../../utils/colors/getColors";

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
                        .setName("option")
                        .setDescription("Option to edit.")
                        .setRequired(true)
                        .addChoices(
                            { name: "name", value: "name" },
                            { name: "color", value: "color" },
                            { name: "logo", value: "logo" }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName("value")
                        .setDescription("Value to set.")
                        .setRequired(true)
                )
        ),
    async execute(interaction, client) {

        const notifyAdminChannel = async (gangData: IGangInit) => {
            const adminChannel = await client.channels.fetch(client.config.bot.adminChannel);
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

            let hexColor: string;
            const hexColorRegex = /^#[0-9A-F]{6}$/i;
            const rgbColorRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
            if (color.match(hexColorRegex)) {
                hexColor = color;
            } else if (color.match(rgbColorRegex)) {
                const [, r, g, b] = color.match(rgbColorRegex) || [];
                hexColor = `#${rgb.hex(parseInt(r), parseInt(g), parseInt(b))}`;
            } else {
                const nearestColor = getNearestColor(color);
                if (nearestColor) {
                    hexColor = nearestColor.hex;
                } else {
                    return "Invalid color. Please provide a valid color name, hex code, or RGB value.";
                }
            }
            gangData = await GangInitSchema.findOne({ gangColor: color });
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
                gangColor: color,
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
                            if (interaction.isRepliable()) {
                                await interaction.followUp({ content: `The invitation to ${user.username} has expired.`, ephemeral: true });
                            } else {
                                client.logger.warn("Interaction no longer repliable when sending expiration notification");
                            }
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

        const editGang = async (option: string, value: string) => {

            let gangData = await GangInitSchema.findOne({ gangLeader: interaction.user.id });
            if (!gangData) {
                return "Cannot edit the gang, you are not a leader of any gang.";
            }

            switch (option) {
                case "name": {
                    const nameRegex = /^[a-zA-Z]+$/;
                    if (!value.match(nameRegex)) {
                        return "Name should only contain alphabets.";
                    }
                    gangData.gangName = value;
                    break;
                }
                case "color": {
                    let hexColor: string;
                    const hexColorRegex = /^#[0-9A-F]{6}$/i;
                    const rgbColorRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;

                    if (value.match(hexColorRegex)) {
                        hexColor = value;
                    } else if (value.match(rgbColorRegex)) {
                        const [, r, g, b] = value.match(rgbColorRegex) || [];
                        hexColor = `#${rgb.hex(parseInt(r), parseInt(g), parseInt(b))}`;
                    } else {
                        const nearestColor = getNearestColor(value);
                        if (nearestColor) {
                            hexColor = nearestColor.hex;
                        } else {
                            return "Invalid color. Please provide a valid color name, hex code, or RGB value.";
                        }
                    }

                    gangData.gangColor = hexColor;
                    break;
                }
                case "logo": {
                    const logoRegex = /^https?:\/\/.*\.(?:png|jpg|jpeg)$/;
                    if (!value.match(logoRegex)) {
                        return "Logo should be a valid image link.";
                    }
                    gangData.gangLogo = value;
                    break;
                }
                default: {
                    return "Invalid option.";
                }
            }

            await gangData.save();
            return `Gang ${option} updated successfully.`;
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
                    const option = interaction.options.getString("option", true);
                    const value = interaction.options.getString("value", true);

                    await interaction.editReply({ content: "Edit gang has been disabled for time being!" });

                    const response = await editGang(option, value);
                    await interaction.editReply(response);
                    break;
                }
                default: {
                    await interaction.editReply("Invalid subcommand.");
                    break;
                }
            }
        } catch (error) {
            client.logger.error("Error in gang command:");
            client.logger.error(error);
            await interaction.editReply("An error occurred while processing your request.");
        }
    }
};

export default command;