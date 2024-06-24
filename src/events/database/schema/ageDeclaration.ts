import { Schema, model } from "mongoose";

import { IAgeDeclaration } from "../../../types";

const blockUserSchema = new Schema<IAgeDeclaration>({
    guildId: { type: String, required: true },
    status: { type: Boolean, default: true, required: true },
    above18: { type: String, required: true },
    below18: { type: String, required: true },
    count: { type: Number, default: 0, required: true },
});

export default model('age-declaration', blockUserSchema);