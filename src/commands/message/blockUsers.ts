import { Command } from '../../types';
import blockUser from "../../events/database/schema/blockUser";
import blockUserAI from "../../events/database/schema/blockUserAI";

const command: Command = {
    name: 'blockuser',
    description: "Blocks a user from using the bot. | blockuser <user-id> <add/remove> <type> <reason>",
    cooldown: 1000,
    owner: true,
    userPerms: [],
    botPerms: ['Administrator'],
    async execute(client, message, args) {
        const userID = args[0];
        const action = args[1];
        const type = args[2];
        var reason = args.slice(3).join(' ');

        if (!reason) reason = 'No reason provided!';
        if (!userID || !type || !action) return message.reply('Please provide a user id, action, and type!');

        if (type === 'ai') {
            if (action === 'add') {
                var blockUserData = await blockUserAI.findOne({
                    userId: userID
                });

                if (!blockUserData) {
                    blockUserData = new blockUserAI({
                        userId: userID,
                        status: false
                    });
                } 
                
                if (blockUserData.status) return message.reply('User is already blocked!');

                blockUserData.status = true;
                blockUserData.data.push({
                    reason: reason,
                    date: new Date()
                });
                
                await blockUserData.save();
                return message.reply(`User <@${userID}> has been blocked from using the AI!`);
            } else if (action === 'remove') {
                var blockUserData = await blockUserAI.findOne({
                    userId: userID,
                    status: true
                });

                if (!blockUserData) return message.reply('User is not blocked!');

                blockUserData.status = false;
                await blockUserData.save();
                return message.reply(`User <@${userID}> has been unblocked from using the AI!`);
            }
        } else if (type === 'bot') {
            if (action === 'add') {
                var blockUserData = await blockUser.findOne({
                    userId: userID
                });

                if (!blockUserData) {
                    blockUserData = new blockUser({
                        userId: userID,
                        status: false
                    });
                }

                if (blockUserData.status) return message.reply('User is already blocked!');

                blockUserData.status = true;
                blockUserData.data.push({
                    reason: reason,
                    date: new Date()
                });

                await blockUserData.save();
                return message.reply(`User <@${userID}> has been blocked from using the bot!`);
            } else if (action === 'remove') {
                var blockUserData = await blockUser.findOne({
                    userId: userID,
                    status: true
                });

                if (!blockUserData) return message.reply('User is not blocked!');

                blockUserData.status = false;
                await blockUserData.save();
                return message.reply(`User <@${userID}> has been unblocked from using the bot!`);
            }
        } else {
            return message.reply('Invalid type. Please use "ai" or "bot".');
        }

        return message.reply('Invalid action. Please use "add" or "remove".');
    }
};

export default command;