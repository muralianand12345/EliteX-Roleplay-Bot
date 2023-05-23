const {
    Events,
    Collection
} = require('discord.js');
//Modals
const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require('discord.js');
//Embed and Buttons
const {
    EmbedBuilder,
    ActionRowBuilder
} = require("discord.js");

const cooldown = new Collection();

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        var AuctionEmbed = new EmbedBuilder();

        if (interaction.customId == "apply-auction") {

            if (cooldown.has(interaction.user.id)) {
                return interaction.reply({ content: `You are on a cooldown!`, ephemeral: true });
            } else {

                const auctionModal = new ModalBuilder()
                    .setCustomId('auction-modal')
                    .setTitle('Auction Registration');

                const TeamName = new TextInputBuilder()
                    .setCustomId('auction-team-name')
                    .setLabel('Team Name')
                    .setRequired(true)
                    .setStyle(TextInputStyle.Short);

                const TeamLeader = new TextInputBuilder()
                    .setCustomId('auction-team-leader')
                    .setLabel('Team Leader Name + Discord ID')
                    .setPlaceholder('Incharge for deposit Money/Auction leader')
                    .setRequired(true)
                    .setStyle(TextInputStyle.Short);

                const TeamCount = new TextInputBuilder()
                    .setCustomId('auction-team-count')
                    .setLabel('Team Count and Opting Business')
                    .setPlaceholder('Select the likely business from the list')
                    .setRequired(true)
                    .setStyle(TextInputStyle.Short);

                const Money = new TextInputBuilder()
                    .setCustomId('auction-money')
                    .setLabel('Total deposit money')
                    .setRequired(true)
                    .setStyle(TextInputStyle.Short);

                const TeamMember = new TextInputBuilder()
                    .setCustomId('auction-team-member')
                    .setLabel('Team members')
                    .setPlaceholder('In game name | Phone number | Discord ID')
                    .setMaxLength(1000)
                    .setRequired(true)
                    .setStyle(TextInputStyle.Paragraph);

                const firstActionRow = new ActionRowBuilder().addComponents(TeamName);
                const secondActionRow = new ActionRowBuilder().addComponents(TeamLeader);
                const thirdActionRow = new ActionRowBuilder().addComponents(TeamCount);
                const fourthActionRow = new ActionRowBuilder().addComponents(Money);
                const fivethActionRow = new ActionRowBuilder().addComponents(TeamMember);

                auctionModal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow, fivethActionRow);
                await interaction.showModal(auctionModal);

                cooldown.set(interaction.user.id);
                setTimeout(() => {
                    cooldown.delete(interaction.user.id);
                }, 10000);
            }
        }

        if (interaction.customId == "auction-modal") {

            const AucTeamName = interaction.fields.getTextInputValue('auction-team-name');
            const AucTeamLeader = interaction.fields.getTextInputValue('auction-team-leader');
            const AucTeamCount = interaction.fields.getTextInputValue('auction-team-count');
            const AucMoney = interaction.fields.getTextInputValue('auction-money');
            const AucTeamMember = interaction.fields.getTextInputValue('auction-team-member');

            AuctionEmbed.setColor('Red')
                .setDescription(`Submitted By <@${interaction.user.id}>`)
                .addFields(
                    { name: 'Team Name', value: `${AucTeamName}` },
                    { name: 'Team Leader', value: `${AucTeamLeader}` },
                    { name: 'Team Count and Business', value: `${AucTeamCount}` },
                    { name: 'Money Collected', value: `${AucMoney}` },
                    { name: 'Team Member', value: `${AucTeamMember}` }
                )
                .setFooter({ text: `${interaction.user.id}` })
                .setTimestamp();

            await client.channels.cache.get('1110188340906573945').send({
                embeds: [AuctionEmbed]
            }).then(async (msg) => {
                return interaction.reply({ content: 'Form recieved successfully!', ephemeral: true });
            });
        }
    }
}