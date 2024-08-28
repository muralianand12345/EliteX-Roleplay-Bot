import Color from "color";
import { ColorResolvable } from "discord.js";

const ValidateColor = (inputColor: string): ColorResolvable | null => {
    try {
        let color = Color(inputColor);
        return color.hex() as ColorResolvable;
    } catch (error: Error | any) {
        return null;
    }
};

export default ValidateColor;