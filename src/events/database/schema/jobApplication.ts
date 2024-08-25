import { Schema, model } from "mongoose";
import { IJobApplication } from "../../../types";

const jobApplicationSchema = new Schema<IJobApplication>({
    userId: { type: String, required: true },
    accepted: { type: Boolean, default: false },
    data: [{
        jobValue: { type: String, required: true },
        jobName: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
        user_response: [{
            question: { type: String, required: true },
            answer: { type: String, required: true }
        }]
    }]
});

export default model('job-application', jobApplicationSchema);