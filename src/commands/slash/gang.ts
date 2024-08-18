import { SlashCommandBuilder, EmbedBuilder, User, ColorResolvable } from "discord.js";
import GangInitSchema from "../../events/database/schema/gangInit";
import { SlashCommand } from "../../types";

const command: SlashCommand = {
    cooldown: 1000,
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
                .addStringOption(option =>
                    option
                        .setName("logo")
                        .setDescription("Logo of the gang.")
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

        const createGang = async (name: string, color: string, logo: string) => {

            let gangData = await GangInitSchema.findOne({ gangLeader: interaction.user.id });
            if (gangData) {
                return "Cannot create a gang, you are already a leader of a gang.";
            }

            gangData = await GangInitSchema.findOne({ "gangMembers.userId": interaction.user.id });
            if (gangData) {
                return "Cannot create a gang, you are already a member of a gang.";
            }

            //name validation
            const nameRegex = /^[a-zA-Z]+$/;
            if (!name.match(nameRegex)) {
                return "Name should only contain alphabets.";
            }
            gangData = await GangInitSchema.findOne({ gangName: name });
            if (gangData) {
                return "Name already exists.";
            }

            //color validation
            const colorRegex = /^#[0-9A-F]{6}$/i;
            if (!color.match(colorRegex)) {
                return "Hex color should be in the format #000000.";
            }
            gangData = await GangInitSchema.findOne({ gangColor: color });
            if (gangData) {
                return "Color already exists.";
            }

            //logo validation
            const logoRegex = /^https?:\/\/.*\.(?:png|jpg|jpeg)$/;
            if (!logo.match(logoRegex)) {
                return "Logo should be a valid image link.";
            }

            gangData = new GangInitSchema({
                gangName: name,
                gangColor: color,
                gangLogo: logo,
                gangLeader: interaction.user.id,
                gangMembers: [{
                    userId: interaction.user.id,
                    gangJoinDate: new Date()
                }],
                gangCreated: new Date(),
                gangStatus: true
            });

            await gangData.save();
            return `Gang ${name} created successfully.`;
        };

        const inviteUser = async (user: User) => {

            let gangData = await GangInitSchema.findOne({ gangLeader: interaction.user.id });
            if (!gangData) {
                return "Cannot invite a user, you are not a leader of any gang.";
            }

            gangData = await GangInitSchema.findOne({ "gangMembers.userId": user.id });
            if (gangData) {
                return "Cannot invite a user, the user is already a member of a gang.";
            }

            gangData = await GangInitSchema.findOne({ gangLeader: user.id });
            if (gangData) {
                return "Cannot invite a user, the user is already a leader of a gang.";
            }

            gangData = await GangInitSchema.findOne({ "gangMembers.userId": interaction.user.id });
            if (!gangData) {
                return "Cannot invite a user, you are not a member of any gang.";
            }

            gangData.gangMembers.push({
                userId: user.id,
                gangJoinDate: new Date()
            });

            await gangData.save();
            return `User ${user.username} invited successfully.`;
        };

        const kickUser = async (user: User) => {

            let gangData = await GangInitSchema.findOne({ gangLeader: interaction.user.id });
            if (!gangData) {
                return "Cannot kick a user, you are not a leader of any gang.";
            }

            gangData = await GangInitSchema.findOne({ "gangMembers.userId": user.id });
            if (!gangData) {
                return "Cannot kick a user, the user is not a member of any gang.";
            }

            gangData.gangMembers = gangData.gangMembers.filter(member => member.userId !== user.id);

            await gangData.save();
            return `User ${user.username} kicked successfully.`;
        };

        const viewStatus = async () => {
            let gangData = await GangInitSchema.findOne({
                $or: [
                    { gangLeader: interaction.user.id },
                    { "gangMembers.userId": interaction.user.id }
                ]
            });

            if (!gangData) {
                return "You are not a leader or a member of any gang.";
            }

            const embed = new EmbedBuilder()
                .setTitle(`Gang: ${gangData.gangName}`)
                .setColor(gangData.gangColor as ColorResolvable)
                .setThumbnail(gangData.gangLogo)
                .addFields(
                    { name: "Leader", value: `<@${gangData.gangLeader}>`, inline: true },
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
                    const colorRegex = /^#[0-9A-F]{6}$/i;
                    if (!value.match(colorRegex)) {
                        return "Hex color should be in the format #000000.";
                    }
                    gangData.gangColor = value;
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

        try {
            switch (interaction.options.getSubcommand()) {
                case "create": {
                    const name = interaction.options.getString("name", true);
                    const color = interaction.options.getString("color", true);
                    const logo = interaction.options.getString("logo", true);

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
            console.error("Error in gang command:", error);
            await interaction.editReply("An error occurred while processing your request.");
        }
    }
};

export default command;