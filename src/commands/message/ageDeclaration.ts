import { EmbedBuilder, TextChannel, StringSelectMenuBuilder, ActionRowBuilder, Role } from "discord.js";

import { Command } from '../../types';
import ageDeclarationModal from '../../events/database/schema/ageDeclaration';

const command: Command = {
    name: 'agedeclaration',
    description: "Sends age declaration menu message to a channel. | agedeclaration <above-18-role-id> <below-18-role-id>",
    cooldown: 1000,
    owner: true,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    async execute(client, message, args) {

        const chan = message.channel as TextChannel;;

        const role1 = message.guild?.roles.cache.find(role => role.id === args[0]) as Role;
        const role2 = message.guild?.roles.cache.find(role => role.id === args[1]) as Role;

        if (!role1 || !role2) return client.logger.error('Declaration roles not found!');

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

        var embed = new EmbedBuilder()
            .setColor('Blue')
            .setDescription('Please confirm you have read the below message by clicking the "Verify" button and proceed to the Age Verification Section!')
            .setImage('https://cdn.discordapp.com/attachments/1096858331110457485/1254860659703939102/DISCLAIMER_copy.png');


        var row = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('age-category')
                    .setPlaceholder('Select your age category!')
                    .addOptions(ageOptions),
            );

        var ageDeclarationData = await ageDeclarationModal.findOne({
            guildId: message.guild?.id
        });

        if (!ageDeclarationData) {
            ageDeclarationData = new ageDeclarationModal({
                guildId: message.guild?.id,
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

        return await message.delete();
    }
};

export default command;