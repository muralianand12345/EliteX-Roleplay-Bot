import { Schema, model } from "mongoose";
import { IBlockUser } from "../../../types";

const blockUserAISchema = new Schema<IBlockUser>({
    userId: { type: String, required: true },
    status: { type: Boolean, required: true },
    data: [{
        reason: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
    }],
});

export default model('blocked-user-ai', blockUserAISchema);