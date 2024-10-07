import { Schema, model } from "mongoose";
import { IGangInit } from "../../../types";

const ganginitSchema = new Schema<IGangInit>({
    gangName: { type: String, required: true },
    gangColor: { type: String, required: true },
    gangLogo: { type: String, required: true },
    gangLeader: { type: String, required: true },
    gangRole: { type: String, required: true },
    gangMembers: [{
        userId: { type: String, required: true },
        username: { type: String, required: true },
        isActive: { type: Boolean, required: true, default: true },
        gangJoinDate: { type: Date, required: true }
    }],
    gangVoiceChat: { type: String, required: false },
    gangCreated: { type: Date, required: true, default: Date.now },
    gangStatus: { type: Boolean, required: true, default: true },
    warWon: { type: Number, required: false, default: 0 },
    gangLocation: [{ type: String, required: false }]
});

export default model('gang-data', ganginitSchema);