import { Schema, model } from "mongoose";
import { IGangInit } from "../../../types";

const ganginitSchema = new Schema<IGangInit>({
    gangName: { type: String, required: true },
    gangColor: { type: String, required: true },
    gangLogo: { type: String, required: true },
    gangLeader: { type: String, required: true },
    gangMembers: [{
        userId: { type: String, required: true },
        gangJoinDate: { type: Date, required: true }
    }],
    gangCreated: { type: Date, required: true, default: Date.now },
    gangStatus: { type: Boolean, required: true, default: true }
});

export default model('gang-data', ganginitSchema);