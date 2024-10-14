import { Schema, model } from "mongoose";
import { IFivemSurvey, IFivemSurveyData } from "../../../types";

const surveyDataSchema = new Schema<IFivemSurveyData>({
    citizenId: { type: String, required: true },
    IgName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    cpu: { type: String, required: true },
    gpu: { type: String, required: true },
    ram: { type: String, required: true },
    identifier: { type: String, required: false }
});

const fivemSurveySchema = new Schema<IFivemSurvey>({
    userId: { type: String, required: true },
    surveyData: [surveyDataSchema]
});

export default model<IFivemSurvey>('fivem-surveys', fivemSurveySchema);