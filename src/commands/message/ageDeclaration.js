const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require("discord.js");

const ageDeclarationModal = require('../../events/database/modals/ageDeclarationRole.js');

module.exports = {
    name: 'agedeclaration',
    description: "Sends age declaration | agedeclaration <above 18 role id> <below 18 role id>",
    cooldown: 1000,
    owner: true,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    async execute(client, message, args) {

        const chan = message.channel;

        const role1 = message.guild.roles.cache.find(role => role.id === args[0]);
        const role2 = message.guild.roles.cache.find(role => role.id === args[1]);

        if (!role1 || !role2) return;

        var embed = new EmbedBuilder()
            .setColor('Blue')
            .setDescription('Please confirm you have read the below message by clicking the "Verify" button and proceed to the Age Verification Section!')
            .setImage('https://cdn.discordapp.com/attachments/1096858331110457485/1206611845763432498/DISCLAIMER_copy.png');

        var ageOptions = [
            {
                label: 'Above 18',
                value: 'above-18',
                description: 'Click to verify you are above 18',
                emoji: '👨',
            },
            {
                label: 'Below 18',
                value: 'below-18',
                description: 'Click to verify you are below 18',
                emoji: '🧒',
            }
        ]

        var row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('age-category')
                    .setPlaceholder('Select your age category!')
                    .addOptions(ageOptions),
            );

        var ageDeclarationData = await ageDeclarationModal.findOne({
            guildID: message.guild.id
        });

        if (!ageDeclarationData) {
            ageDeclarationData = new ageDeclarationModal({
                guildID: message.guild.id,
                status: true,
                above18: role1.id,
                below18: role2.id
            });
            await ageDeclarationData.save();
        } else {
            ageDeclarationData.status = true;
            ageDeclarationData.above18 = role1.id;
            ageDeclarationData.below18 = role2.id;
            await ageDeclarationData.save();
        }

        await chan.send({
            embeds: [embed],
            components: [row]
        });

    }
}