const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits
} = require('discord.js');

const votingModel = require("../../events/database/modals/voting.js");

module.exports = {
    cooldown: 10000,
    data: new SlashCommandBuilder()
        .setName('voting')
        .setDescription("Voting Poll")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Button Voting Poll')
                .addChannelOption(option => option
                    .setName('vote-channel')
                    .setDescription('Channel to send voting')
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName('vote-num')
                    .setDescription('Total number of buttons')
                    .setRequired(true)
                    .addChoices(
                        { name: '1', value: '1' },
                        { name: '2', value: '2' },
                        { name: '3', value: '3' },
                        { name: '4', value: '4' },
                    )
                )
                .addStringOption(option => option
                    .setName('vote-type')
                    .setDescription('Total number of buttons')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Multiple', value: 'multi' },
                        { name: 'Once', value: 'once' },
                    )
                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete/End a voting')
                .addStringOption(option => option
                    .setName('vote-msgid')
                    .setDescription('Voting message Id')
                    .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('result')
                .setDescription('Get voting result')
                .addStringOption(option => option
                    .setName('vote-msgid')
                    .setDescription('Voting message Id')
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName('vote-result-type')
                    .setDescription('Result Type!')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Percentage', value: 'percentage' },
                        { name: 'Get Users', value: 'users' },
                    )
                )
        ),
    async execute(interaction, client) {

        if (interaction.options.getSubcommand() === "create") {
            const channel = await interaction.options.getChannel("vote-channel");

            var text;

            const collectorFilter = (message) => message.author.id === interaction.user.id;

            await interaction.reply({ content: "Type down the voting content! (Auto cancel in 5 minutes)", ephemeral: true }).then(async () => {
                await interaction.channel.awaitMessages({ filter: collectorFilter, max: 1, time: 300000, errors: ['time'] })
                    .then(async (collected) => {
                        await interaction.editReply({ content: 'Processing...', ephemeral: true });
                        text = collected.first().content;
                    })
                    .catch(async (collected) => {
                        if (collected.size === 0) {
                            await interaction.editReply({ content: 'No voting poll text sent!', ephemeral: true });
                        } 
                    })
            });
            
            if (!text) return;

            const reacEmbed = new EmbedBuilder()
                .setColor('#8F00FF')
                .setDescription(`\`\`\`${text}\`\`\``)
                .setTimestamp();

            const numButtons = await interaction.options.getString("vote-num");
            const btnType = await interaction.options.getString("vote-type");
            const numButtonsInt = parseInt(numButtons);

            if (!isNaN(numButtonsInt) && numButtonsInt > 0) {
                const message = await channel.send({ embeds: [reacEmbed] });
                const buttonIds = ["vote-button-1", "vote-button-2", "vote-button-3", "vote-button-4"];
                const row = new ActionRowBuilder();

                const buttonLabels = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];
                for (let i = 0; i < numButtonsInt; i++) {
                    const button = new ButtonBuilder()
                        .setCustomId(buttonIds[i % buttonIds.length])
                        .setEmoji(buttonLabels[i % buttonLabels.length])
                        .setStyle(ButtonStyle.Primary);
                    row.addComponents(button);
                }

                await message.edit({ content: "", components: [row] });

                const currentTime = new Date().toISOString();
                const newVoting = new votingModel({
                    messageId: message.id,
                    guildId: interaction.guildId,
                    voteType: btnType,
                    time: currentTime,
                    votes: []
                });
                await newVoting.save();

                await interaction.editReply({ content: `Voting Added to the channel: <#${channel.id}>`, ephemeral: true });
            } else {
                await interaction.editReply("Invalid number of reactions. Please specify a positive integer.");
            }
        }

        if (interaction.options.getSubcommand() === "delete") {

            const messageId = interaction.options.getString('vote-msgid');

            const voting = await votingModel.findOne({
                messageId: messageId,
                guildId: interaction.guildId
            });

            if (!voting) {
                await interaction.reply({ content: "Voting not found.", ephemeral: true });
                return;
            }

            await votingModel.deleteOne({
                messageId: messageId,
                guildId: interaction.guildId
            });
            await interaction.reply({ content: "Voting deleted successfully!", ephemeral: true });
        }

        if (interaction.options.getSubcommand() === "result") {

            const messageId = interaction.options.getString('vote-msgid');
            const resultType = interaction.options.getString('vote-result-type');

            const voting = await votingModel.findOne({ messageId });
            if (!voting) {
                return await interaction.reply({
                    content: `Voting poll with message ID ${messageId} was not found.`,
                    ephemeral: true
                });
            }

            const votesByButtonId = voting.votes.reduce((accumulator, vote) => {
                const buttonId = vote.buttonId;
                accumulator[buttonId] = accumulator[buttonId] ? accumulator[buttonId] + 1 : 1;
                return accumulator;
            }, {});

            if (resultType === 'percentage') {
                const totalVotes = voting.votes.length;
                const votePercentage = Object.keys(votesByButtonId).map(buttonId => {
                    const count = votesByButtonId[buttonId];
                    const percentage = count / totalVotes * 100;
                    return `${percentage.toFixed(1)}% for button ${buttonId}`;
                }).join('\n');

                const embed = new EmbedBuilder()
                    .setTitle(`Voting result for poll ${messageId}`)
                    .setDescription(votePercentage);

                await interaction.reply({ embeds: [embed], ephemeral: true });
            } else if (resultType === 'users') {
                const votesByUserId = voting.votes.reduce((accumulator, vote) => {
                    const userId = vote.userId;
                    const buttonId = vote.buttonId;
                    accumulator[buttonId] = accumulator[buttonId] || {};
                    accumulator[buttonId][userId] = true;
                    return accumulator;
                }, {});

                const embeds = [];
                let votersCount = 0;
                let embed = new EmbedBuilder().setTitle(`Voting result for poll ${messageId}`);

                Object.keys(votesByButtonId).forEach(buttonId => {
                    const voterIds = Object.keys(votesByUserId[buttonId] || {});
                    const voters = voterIds.length ? voterIds.map(id => `<@${id}>`).join('\n') : 'None';
                    embed.addFields({ name: `Button ${buttonId}`, value: voters, inline: true });
                    votersCount += voterIds.length;

                    if (votersCount >= 100) {
                        embeds.push(embed);
                        embed = new EmbedBuilder().setTitle(`Voting result for poll ${messageId}`);
                        votersCount = 0;
                    }
                });

                if (votersCount > 0) {
                    embeds.push(embed);
                }

                embeds.forEach((embed, index) => {
                    if (index === 0) {
                        interaction.reply({ embeds: [embed], ephemeral: true });
                    } else {
                        interaction.followUp({ embeds: [embed], ephemeral: true });
                    }
                });

            } else {
                await interaction.reply({
                    content: `Invalid vote result type "${resultType}". Expected "percentage" or "users".`,
                    ephemeral: true
                });
            }
        }
    }
};