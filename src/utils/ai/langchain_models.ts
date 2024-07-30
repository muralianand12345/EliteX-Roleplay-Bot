import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { ChatGroq } from "@langchain/groq";
import { config } from "dotenv";

config();

const groq_default_api_key = process.env.GROQ_API_KEY;
const hf_default_api_key = process.env.HUGGINGFACEHUB_API_KEY;

const gen_model = async (temperature: number = 0, model: string = "llama3-70b-8192", apiKey: string | undefined = groq_default_api_key) => {
    return new ChatGroq({
        apiKey: apiKey,
        model: model,
        temperature: temperature
    });
};

const embed_model = async (apiKey: string| undefined = hf_default_api_key) => {
    return new HuggingFaceInferenceEmbeddings({
        apiKey: apiKey
    });
}

export { gen_model, embed_model };