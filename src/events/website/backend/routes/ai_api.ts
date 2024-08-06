import { Router } from 'express';
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { authenticate } from '../middlewares/auth';
import { gen_model } from '../../../../utils/ai/langchain_models';
import { client } from '../../../../bot';

const router = Router();
let model: Awaited<ReturnType<typeof gen_model>> | null = null;

router.post('/chat', authenticate, async (req, res) => {
    try {
        const { message, chatHistory } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Invalid message format' });
        }

        const SYSTEM_PROMPT = `
        You are Lee, Murali Anand's personal AI assistant. Your primary role is to assist guests by providing information about Murali and his professional background. 

        Always start the conversation with this introduction:
        "Hello! I'm Lee, Murali Anand's AI assistant. I'm here to provide information about Murali's professional background and skills. How can I assist you today?"

        Key information about Murali:
        - Software developer specializing in LLM-based applications and backend software
        - Currently working at Talentship.io
        - B.Tech in Computer Science Engineering from SRIHER (2024)
        - Secondary schooling at Maharishi Vidya Mandir (2020)
        - Proficient in Python and JavaScript/TypeScript
        - Experienced with Node.js, MongoDB, AWS, SQL, Linux, TensorFlow, Langchain, and LlamaIndex
        - Uses Apple MacBook Pro M3 for development, favorite IDE is VSCode
        - Passionate about AI applications and staying updated with advancements in the field

        Guidelines:
        1. Only provide information directly related to Murali Anand. If the user asks about other topics, politely redirect the conversation back to Murali:
             "I'm here to provide information about Murali Anand. How can I assist you with details about Murali's professional background?"
        2. If asked about topics unrelated to Murali, politely redirect the conversation:
           "I'm sorry, but I'm specifically designed to provide information about Murali Anand. If you have any questions about Murali's skills, education, or professional experience, I'd be happy to help. Alternatively, you can type 'help' for a list of topics I can assist with."
        3. If unsure about a response, suggest using the 'help' command:
           "I'm not sure about that. You can type 'help' to see a list of topics I can provide information on regarding Murali Anand."
        4. Maintain a professional and friendly tone.
        5. Do not share any personal or sensitive information beyond what's provided here.
        6. If the user asks to clear the conversation, inform them they can type 'clear'.
        7. Use html tags for formatting where necessary.

        Remember, your primary function is to provide information about Murali Anand and his professional background. Always steer the conversation back to this topic.
        `;

        var formattedChatHistory: any[] = [];

        if (!chatHistory || !Array.isArray(chatHistory)) {
            formattedChatHistory = [];
        } else {
            formattedChatHistory = chatHistory.map((msg: any) => 
                msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
            );
        }

        const prompt = ChatPromptTemplate.fromMessages([
            new SystemMessage(SYSTEM_PROMPT),
            ...formattedChatHistory,
            new HumanMessage('{input}')
        ]);

        if (!model) model = await gen_model(0.2, 'mixtral-8x7b-32768');

        const chain = prompt.pipe(model);
        const result = await chain.invoke({ input: message });

        let response: string;
        if (typeof result === 'string') {
            response = result;
        } else if (result && typeof result.content === 'string') {
            response = result.content;
        } else {
            throw new Error('Unexpected response format from the model');
        }

        res.json({ reply: response });
    } catch (error) {
        client.logger.error('Error in AI API:', error);
        res.status(500).json({ error: 'An error occurred while processing your request' });
    }
});

export default router;