import Color from "color";

const ValidateColor = (inputColor: string): string | null => {
    try {
        const color = Color(inputColor);
        return color.hex();
    } catch (error) {
        return null;
    }
};

export default ValidateColor;