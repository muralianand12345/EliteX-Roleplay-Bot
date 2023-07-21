const {
    Events
} = require('discord.js');

const votingModel = require("../../events/models/voting.js");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        if (!interaction.isButton()) return;

        if (interaction.customId && interaction.customId.startsWith("vote-button-")) {

            await interaction.deferReply({ ephemeral: true });

            const voting = await votingModel.findOne({
                messageId: interaction.message.id,
                guildId: interaction.guildId
            });

            if (!voting) {
                return await interaction.editReply({ content: "Voting has expired.", ephemeral: true });
            }

            const vote = {
                userId: interaction.user.id,
                buttonId: interaction.customId
            };

            if (voting.voteType === 'once') {
                const hasVoted = voting.votes.some(v => v.userId === interaction.user.id);
                if (hasVoted) {
                    await interaction.editReply({ content: 'You have already voted in this poll.', ephemeral: true });
                    return;
                }
            }

            if (voting.voteType === 'multi') {
                const hasVoted = voting.votes.some(v => v.userId === interaction.user.id && v.buttonId === interaction.customId);
                if (hasVoted) {
                    await interaction.editReply({ content: 'You have already voted for this option.', ephemeral: true });
                    return;
                }

                voting.votes.push(vote);
                await voting.save();

                await interaction.editReply({ content: "Thank you for your vote!", ephemeral: true });
                return;
            }

            voting.votes.push(vote);
            await voting.save();

            await interaction.editReply({ content: "Thank you for your vote!", ephemeral: true });
        }
    }
};