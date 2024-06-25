import { Schema, model } from "mongoose";
import { IBirthday } from "../../../types";

const birthdaySchema = new Schema<IBirthday>({
    userId: { type: String, required: true },
    day: { type: Number, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: false },
    age: { type: Number, required: false }
});

export default model('birthday-users', birthdaySchema);