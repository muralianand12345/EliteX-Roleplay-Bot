import { Schema, model } from "mongoose";
import { IGangZonalWar } from "../../../types";

const gangZonalWarSchema = new Schema<IGangZonalWar>({
    warLocation: { type: String, required: true },
    warStatus: { type: String, required: true, enum: ['active', 'ended'], default: 'active' },
    combatants: [{
        gangName: { type: String, required: true },
        gangLeader: { type: String, required: true },
        gangLogo: { type: String, required: true },
        gangRole: { type: String, required: true },
        gangMembers: { type: Array, required: true }
    }],
    warEnd: { type: Date, required: false },
    timestamp: { type: Date, required: true, default: Date.now }
});

export default model('gang-zonal-war', gangZonalWarSchema);